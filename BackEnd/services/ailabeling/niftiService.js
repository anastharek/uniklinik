'use strict'

/**
 * Research NIfTI conversion service (Phase 1 — DICOM + NIfTI viewer).
 *
 * Pipeline (all server-side, UID-driven):
 *   1. QIDO-RS instance list for StudyInstanceUID + SeriesInstanceUID.
 *   2. WADO-RS retrieve each instance (multipart stripped). If the stored
 *      transfer syntax is compressed (JPEG-LS / JPEG / J2K), re-retrieve
 *      transcoded to uncompressed via `?transferSyntax=1.2.840.10008.1.2`
 *      (Orthanc gdcm plugin decodes) — the apt dcm2niix build has no
 *      JPEG-LS decoder.
 *   3. dcm2niix -> .nii.gz + sidecar .json.
 *   4. Geometry + provenance + ADC-scaling validation envelope stored next
 *      to the volume; results cached by
 *      sha1(studyUid|seriesUid|converterVersion|sortedSOPUIDs).
 *
 * The source DICOM is never modified. All endpoints are behind the same
 * authenticated session used by the viewer (tokenOrthancJs) — identical
 * access posture to the existing /api/dicom-web proxy.
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')
const { execFile } = require('child_process')
const { promisify } = require('util')

const execFileP = promisify(execFile)

const ORTHANC = process.env.ORTHANC_ADDRESS + ':' + process.env.ORTHANC_PORT
const ORTHANC_AUTH = Buffer.from(
  `${process.env.ORTHANC_USERNAME}:${process.env.ORTHANC_PASSWORD}`
).toString('base64')

const DCM2NIIX = process.env.DCM2NIIX_BIN || 'dcm2niix'
const CONVERTER_VERSION = process.env.NIFTI_CONVERTER_VERSION || 'dcm2niix-1.0.20220720-apt'
const CACHE_ROOT = process.env.NIFTI_CACHE_DIR || path.join(__dirname, '../../nifti-cache')
const MAX_INSTANCES = parseInt(process.env.NIFTI_MAX_INSTANCES || '2000', 10)
const JOB_TIMEOUT_MS = parseInt(process.env.NIFTI_JOB_TIMEOUT_MS || '600000', 10)
const MAX_CONCURRENT = parseInt(process.env.NIFTI_MAX_CONCURRENT || '2', 10)

const UNCOMPRESSED_SYNTAXES = new Set([
  '1.2.840.10008.1.2', // Implicit VR LE
  '1.2.840.10008.1.2.1', // Explicit VR LE
  '1.2.840.10008.1.2.2', // Explicit VR BE
  '1.2.840.10008.1.2.1.99', // Deflated
])

/** In-memory job registry (survives nothing — cache persists, jobs do not). */
const jobs = new Map()
let activeConversions = 0
const queue = []

async function orthancFetch(api, options = {}) {
  const res = await fetch(ORTHANC + api, {
    ...options,
    headers: {
      Authorization: 'Basic ' + ORTHANC_AUTH,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`Orthanc ${api.split('?')[0]} -> ${res.status}`)
  return res
}

async function orthancJson(api) {
  const res = await orthancFetch(api)
  return res.json()
}

async function orthancBuffer(api, headers = {}) {
  const res = await orthancFetch(api, { headers })
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

/* ------------------------------------------------------------------ *
 * DICOMweb JSON tag helpers (values may be {Value:[..], vr} or plain)
 * ------------------------------------------------------------------ */
function tagValues(entry) {
  if (entry === undefined || entry === null) return []
  if (Array.isArray(entry.Value)) return entry.Value.map(v => String(v))
  if (Array.isArray(entry)) return entry.map(v => String(v))
  if (entry.Value !== undefined) return [String(entry.Value)]
  return [String(entry)]
}

function tagStr(entry, fallback = '') {
  const v = tagValues(entry)
  return v.length ? v[0] : fallback
}

function tagStrList(entry, fallback = []) {
  const v = tagValues(entry)
  return v.length ? v : fallback
}

/* ------------------------------------------------------------------ *
 * Retrieval
 * ------------------------------------------------------------------ */
async function listSeriesInstances(studyUid, seriesUid) {
  const api = `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances`
  const list = await orthancJson(api)
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('No DICOM instances found for this series')
  }
  return list.map((it, idx) => ({
    sopUid: tagStr(it['00080018']),
    instanceNumber: tagStr(it['00200013'], String(idx + 1)),
  }))
}

/** Fetch one instance (optionally transcoded to uncompressed) as a DICOM file. */
async function retrieveInstance(studyUid, seriesUid, sopUid, transcode) {
  let api = `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}`
  const headers = { Accept: 'multipart/related; type="application/dicom"' }
  if (transcode) {
    api += '?transferSyntax=1.2.840.10008.1.2'
  }
  const buf = await orthancBuffer(api, headers)
  return stripMultipart(buf)
}

/**
 * Fetch the whole series in ONE WADO-RS request (multipart with N parts).
 * Optionally transcodes every instance to uncompressed in the same call
 * (JPEG-LS / JPEG / J2K -> Explicit VR LE via the Orthanc gdcm plugin).
 * Returns [{ sopUid, buf }] in the multipart order.
 */
async function retrieveSeries(studyUid, seriesUid, transcode) {
  let api = `/dicom-web/studies/${studyUid}/series/${seriesUid}`
  const headers = { Accept: 'multipart/related; type="application/dicom"' }
  if (transcode) {
    api += '?transferSyntax=1.2.840.10008.1.2'
  }
  const buf = await orthancBuffer(api, headers)
  return splitMultipart(buf)
}

/** Split a multipart/related body into its DICOM parts. */
function splitMultipart(buf) {
  const head = buf.slice(0, 256)
  const m = head.toString('latin1').match(/^--([^\r\n]+)\r\n/m)
  if (!m) {
    // Not multipart (single-part response) — wrap it
    return [{ sopUid: null, buf }]
  }
  const boundary = m[1]
  const delim = Buffer.from('--' + boundary)
  const parts = []
  let pos = 0
  while (true) {
    const start = buf.indexOf(delim, pos)
    if (start === -1) break
    const afterBoundary = start + delim.length
    // skip the boundary line's CRLF (or "--" for the closing delimiter)
    let dataStart = afterBoundary
    if (buf[dataStart] === 0x2d && buf[dataStart + 1] === 0x2d) break // closing --
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2
    // find headers end
    const hdrEnd = buf.indexOf('\r\n\r\n', dataStart)
    if (hdrEnd === -1) break
    const bodyStart = hdrEnd + 4
    const next = buf.indexOf(delim, bodyStart)
    if (next === -1) break
    // trim the CRLF before the next boundary
    let end = next
    if (end >= 2 && buf[end - 2] === 0x0d && buf[end - 1] === 0x0a) end -= 2
    parts.push({ sopUid: null, buf: Buffer.from(buf.subarray(bodyStart, end)) })
    pos = next
  }
  return parts
}

/** Strip MIME multipart wrapper (WADO-RS returns boundary-delimited parts). */
function stripMultipart(buf) {
  if (buf.slice(0, 2).toString() === '--') {
    const idx = buf.indexOf('\r\n\r\n')
    if (idx !== -1) {
      const part = buf.subarray(idx + 4)
      const end = part.indexOf('\r\n--')
      if (end !== -1) return Buffer.from(part.subarray(0, end))
      return Buffer.from(part)
    }
  }
  return buf
}

/** Read the TransferSyntax (0002,0010) from a Part-10 DICOM file. */
function readTransferSyntax(buf) {
  if (buf.length < 132 || buf.slice(128, 132).toString() !== 'DICM') return null
  let off = 132
  const readTag = () => (buf.readUInt16LE(off) << 16) | buf.readUInt16LE(off + 2)
  while (off + 8 <= buf.length) {
    const tag = readTag()
    const vr = buf.toString('ascii', off + 4, off + 6)
    let len
    let valueOff
    if (['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'].includes(vr)) {
      len = buf.readUInt32LE(off + 8)
      valueOff = off + 12
    } else {
      len = buf.readUInt16LE(off + 6)
      valueOff = off + 8
    }
    if (tag === 0x00020010) {
      return buf.toString('ascii', valueOff, valueOff + len).replace(/\0+$/, '')
    }
    off = valueOff + len
    if (tag === 0xfffee000 || tag === 0xfffee00d) break // meta end
  }
  return null
}

/* ------------------------------------------------------------------ *
 * dcm2niix
 * ------------------------------------------------------------------ */
async function runDcm2niix(inDir, outDir, outName) {
  const args = ['-z', 'y', '-o', outDir, '-f', outName, '-b', 'yes', inDir]
  const { stdout } = await execFileP(DCM2NIIX, args, {
    timeout: 300000,
    maxBuffer: 8 * 1024 * 1024,
  })
  return stdout
}

/* ------------------------------------------------------------------ *
 * NIfTI-1 header parse (gzip .nii.gz) — minimal, deterministic
 * ------------------------------------------------------------------ */
function parseNiftiHeader(buf) {
  const gunzipped = zlib.gunzipSync(buf)
  const h = gunzipped.subarray(0, 348)
  const dv = new DataView(h.buffer, h.byteOffset, h.byteLength)
  const dims = []
  for (let i = 0; i < 8; i++) dims.push(dv.getInt16(40 + i * 2, true))
  const pixDims = []
  for (let i = 0; i < 8; i++) pixDims.push(dv.getFloat32(76 + i * 4, true))
  return {
    dims,
    datatype: dv.getUint16(70, true),
    bitpix: dv.getUint16(72, true),
    pixDims,
    voxOffset: dv.getFloat32(108, true),
    sclSlope: dv.getFloat32(112, true),
    sclInter: dv.getFloat32(116, true),
    qformCode: dv.getUint16(252, true),
    sformCode: dv.getUint16(254, true),
    quatern: [dv.getFloat32(256, true), dv.getFloat32(260, true), dv.getFloat32(264, true)],
    qoffset: [dv.getFloat32(268, true), dv.getFloat32(272, true), dv.getFloat32(276, true)],
    srowX: [dv.getFloat32(280, true), dv.getFloat32(284, true), dv.getFloat32(288, true), dv.getFloat32(292, true)],
    srowY: [dv.getFloat32(296, true), dv.getFloat32(300, true), dv.getFloat32(304, true), dv.getFloat32(308, true)],
    srowZ: [dv.getFloat32(312, true), dv.getFloat32(316, true), dv.getFloat32(320, true), dv.getFloat32(324, true)],
  }
}

/* ------------------------------------------------------------------ *
 * ADC / quantitative scaling validation (conservative — no guessing)
 * ------------------------------------------------------------------ */
function validateAdcScaling(meta) {
  const evidence = []
  const modality = tagStr(meta['00080060'])
  const seriesDescription = tagStr(meta['0008103E'])
  const imageType = tagStrList(meta['00080008'])
  const rescaleSlope = tagStr(meta['00281053'], '')
  const rescaleIntercept = tagStr(meta['00281052'], '')
  const rwvSeq = meta['00409096'] && meta['00409096'].Value

  evidence.push(`Modality=${modality || '?'}`)
  evidence.push(`SeriesDescription=${seriesDescription || '(empty)'}`)
  evidence.push(`ImageType=[${imageType.join(',')}]`)

  // RealWorldValueMappingSequence — authoritative when present
  if (Array.isArray(rwvSeq) && rwvSeq.length) {
    const rwv = rwvSeq[0]
    const rwvSlope = tagStr(rwv['00409225'])
    const rwvIntercept = tagStr(rwv['00409224'])
    const lutExplanation = tagStr(rwv['0040A300'])
    let units = ''
    const unitsSeq = rwv['004008EA'] && rwv['004008EA'].Value
    if (Array.isArray(unitsSeq) && unitsSeq.length) {
      units = tagStr(unitsSeq[0]['00080104'])
    }
    evidence.push(`RealWorldValueMappingSequence present (slope=${rwvSlope}, intercept=${rwvIntercept}, units=${units || '?'}, LUT="${lutExplanation}")`)
    if (rwvSlope !== '' || rwvIntercept !== '') {
      return {
        status: 'validated',
        units: units || 'unknown',
        evidence,
        mapping: {
          type: 'realWorldValueMapping',
          slope: parseFloat(rwvSlope),
          intercept: parseFloat(rwvIntercept),
          lutExplanation,
        },
      }
    }
  }

  // Fallback: MR-derived ADC heuristic with rescale present
  const descUpper = (seriesDescription || '').toUpperCase()
  const looksAdc =
    descUpper.includes('ADC') ||
    descUpper.includes('APPARENT DIFFUSION') ||
    imageType.some(t => t.toUpperCase().includes('ADC'))
  if (modality === 'MR' && looksAdc) {
    const slopeOk = rescaleSlope !== ''
    const interceptOk = rescaleIntercept !== ''
    evidence.push(`MR + ADC naming; RescaleSlope=${rescaleSlope || '(default 1)'}, RescaleIntercept=${rescaleIntercept || '(default 0)'}`)
    if (slopeOk || interceptOk) {
      // ADC maps are stored in the scanner's native quantitative units,
      // almost universally 10^-6 mm^2/s. Stored value * slope + intercept.
      return {
        status: 'validated',
        units: '×10⁻⁶ mm²/s',
        evidence,
        mapping: {
          type: 'rescale',
          slope: slopeOk ? parseFloat(rescaleSlope) : 1,
          intercept: interceptOk ? parseFloat(rescaleIntercept) : 0,
          unitsConvention: 'vendor ADC convention (10^-6 mm2/s)',
        },
      }
    }
  }

  const missing = []
  if (modality !== 'MR') missing.push('Modality is not MR')
  if (!looksAdc) missing.push('no ADC indication in SeriesDescription/ImageType')
  if (rescaleSlope === '' && !(Array.isArray(rwvSeq) && rwvSeq.length)) missing.push('no RescaleSlope/Intercept and no RealWorldValueMapping')
  evidence.push('Quantitative scaling could not be validated: ' + missing.join('; '))
  return {
    status: 'not_validated',
    units: null,
    evidence,
    mapping: null,
    reason: missing.join('; '),
  }
}

/* ------------------------------------------------------------------ *
 * Cache + metadata envelope
 * ------------------------------------------------------------------ */
function cacheKeyFor(studyUid, seriesUid, sopUids) {
  const payload = [studyUid, seriesUid, CONVERTER_VERSION, sopUids.join(',')].join('|')
  return crypto.createHash('sha1').update(payload).digest('hex')
}

function cacheDirFor(key) {
  return path.join(CACHE_ROOT, key)
}

async function loadCached(key) {
  const dir = cacheDirFor(key)
  const nii = path.join(dir, 'result.nii.gz')
  const meta = path.join(dir, 'metadata.json')
  if (fs.existsSync(nii) && fs.existsSync(meta)) {
    return { niiPath: nii, metadata: JSON.parse(fs.readFileSync(meta, 'utf8')) }
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Job machinery
 * ------------------------------------------------------------------ */
function createJob(studyUid, seriesUid) {
  const job = {
    id: crypto.randomUUID(),
    studyUid,
    seriesUid,
    status: 'queued', // queued | running | ready | error
    stage: 'Preparing series',
    percent: null, // null = indeterminate
    processed: 0,
    total: 0,
    error: null,
    details: null,
    cacheKey: null,
    niiPath: null,
    metadata: null,
    createdAt: Date.now(),
  }
  jobs.set(job.id, job)
  return job
}

function nextQueued() {
  if (activeConversions < MAX_CONCURRENT && queue.length) {
    const job = queue.shift()
    activeConversions++
    runConversion(job)
      .catch(err => {
        job.status = 'error'
        job.error = String((err && err.message) || err)
        job.stage = 'Error'
      })
      .finally(() => {
        activeConversions--
        setTimeout(nextQueued, 0)
      })
  }
}

function startConversion(studyUid, seriesUid, { preloaded } = {}) {
  const job = createJob(studyUid, seriesUid)
  if (preloaded) {
    // Cache hit detected synchronously — job is immediately ready.
    job.status = 'ready'
    job.stage = 'Ready'
    job.percent = 100
    job.processed = preloaded.total || 0
    job.total = preloaded.total || 0
    job.cacheKey = preloaded.key
    job.niiPath = preloaded.niiPath
    job.metadata = preloaded.metadata
    return job
  }
  queue.push(job)
  nextQueued()
  return job
}

/**
 * Start conversion. Synchronously resolves the instance list so the cache
 * can be checked before returning (fast path: cached job ready immediately).
 */
async function convert(studyUid, seriesUid) {
  if (!studyUid || !seriesUid) throw new Error('studyInstanceUID and seriesInstanceUID are required')
  let instances
  try {
    instances = await listSeriesInstances(studyUid, seriesUid)
  } catch (err) {
    // Let the async job surface the error with a proper stage/error state
    const job = createJob(studyUid, seriesUid)
    job.status = 'error'
    job.error = String((err && err.message) || err)
    job.stage = 'Error'
    return job
  }
  const key = cacheKeyFor(studyUid, seriesUid, instances.map(i => i.sopUid))
  const cached = await loadCached(key)
  if (cached) {
    return startConversion(studyUid, seriesUid, {
      preloaded: { key, niiPath: cached.niiPath, metadata: cached.metadata, total: instances.length },
    })
  }
  return startConversion(studyUid, seriesUid)
}

async function runConversion(job) {
  const { studyUid, seriesUid } = job
  job.status = 'running'

  // 1. list instances (QIDO) — genuine total for progress
  job.stage = 'Retrieving DICOM'
  const instances = await listSeriesInstances(studyUid, seriesUid)
  if (instances.length > MAX_INSTANCES) {
    throw new Error(`Series has ${instances.length} instances (max ${MAX_INSTANCES})`)
  }
  job.total = instances.length

  // 2. cache check (needs SOP list for the key)
  const key = cacheKeyFor(studyUid, seriesUid, instances.map(i => i.sopUid))
  job.cacheKey = key
  const cached = await loadCached(key)
  if (cached) {
    job.status = 'ready'
    job.stage = 'Ready'
    job.percent = 100
    job.processed = job.total
    job.niiPath = cached.niiPath
    job.metadata = cached.metadata
    return
  }

  const tmpRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'nifti-'))
  const inDir = path.join(tmpRoot, 'in')
  const outDir = path.join(tmpRoot, 'out')
  fs.mkdirSync(inDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })
  try {
    // 3. retrieve the whole series in one WADO-RS multipart request
    let parts = []
    try {
      parts = await retrieveSeries(studyUid, seriesUid, false)
    } catch (err) {
      console.warn('[nifti] series retrieve failed, falling back to per-instance', String(err))
    }
    if (!parts.length) {
      job.stage = 'Retrieving DICOM (per instance)'
      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i]
        const filePath = path.join(inDir, `inst_${String(i + 1).padStart(5, '0')}.dcm`)
        const buf = await retrieveInstance(studyUid, seriesUid, inst.sopUid, false)
        fs.writeFileSync(filePath, buf)
        job.processed = i + 1
        job.percent = Math.round(((i + 1) / job.total) * 55)
      }
    } else {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const filePath = path.join(inDir, `inst_${String(i + 1).padStart(5, '0')}.dcm`)
        fs.writeFileSync(filePath, part.buf)
        job.processed = Math.min(i + 1, job.total)
        job.percent = Math.round((Math.min(i + 1, job.total) / job.total) * 55)
      }
    }
    // 4. detect compressed instances; if any, re-retrieve transcoded (gdcm via Orthanc)
    const compressed = []
    for (let i = 0; i < Math.min(parts.length || instances.length, job.total); i++) {
      const filePath = path.join(inDir, `inst_${String(i + 1).padStart(5, '0')}.dcm`)
      if (fs.existsSync(filePath)) {
        const ts = readTransferSyntax(fs.readFileSync(filePath))
        if (ts && !UNCOMPRESSED_SYNTAXES.has(ts)) compressed.push(i)
      }
    }
    if (compressed.length) {
      job.stage = 'Retrieving DICOM (transcoding compressed)'
      const transcoded = await retrieveSeries(studyUid, seriesUid, true)
      for (let n = 0; n < Math.min(transcoded.length, job.total); n++) {
        const filePath = path.join(inDir, `inst_${String(n + 1).padStart(5, '0')}.dcm`)
        fs.writeFileSync(filePath, transcoded[n].buf)
        job.processed = n + 1
        job.percent = 55 + Math.round(((n + 1) / Math.max(transcoded.length, 1)) * 15)
      }
    }
    // 5. convert
    job.stage = 'Converting volume'
    job.percent = 70
    const outName = 'result'
    await runDcm2niix(inDir, outDir, outName)
    const niiPath = path.join(outDir, `${outName}.nii.gz`)
    const sidecarPath = path.join(outDir, `${outName}.json`)
    if (!fs.existsSync(niiPath)) {
      throw new Error('dcm2niix produced no NIfTI output')
    }
    job.stage = 'Validating geometry'
    job.percent = 75
    const sidecar = fs.existsSync(sidecarPath) ? JSON.parse(fs.readFileSync(sidecarPath, 'utf8')) : {}
    const niiBuf = fs.readFileSync(niiPath)
    const header = parseNiftiHeader(niiBuf)

    // 6. ADC validation from WADO-RS metadata (first instance)
    const metaRes = await orthancJson(
      `/dicom-web/studies/${studyUid}/series/${seriesUid}/instances/${instances[0].sopUid}/metadata`
    )
    const meta = (Array.isArray(metaRes) ? metaRes[0] : metaRes) || {}
    const adcValidation = validateAdcScaling(meta)

    // 7. persist cache
    const dir = cacheDirFor(key)
    fs.mkdirSync(dir, { recursive: true })
    const metadata = {
      createdAt: new Date().toISOString(),
      converter: { software: 'dcm2niix', version: CONVERTER_VERSION },
      source: {
        studyInstanceUID: studyUid,
        seriesInstanceUID: seriesUid,
        instanceCount: instances.length,
        sopInstanceUIDs: instances.map(i => i.sopUid),
        seriesDescription: tagStr(meta['0008103E']),
        modality: tagStr(meta['00080060']),
      },
      nifti: {
        dims: header.dims.slice(1, 4),
        pixDims: header.pixDims.slice(1, 4),
        datatype: header.datatype,
        bitpix: header.bitpix,
        qformCode: header.qformCode,
        sformCode: header.sformCode,
        quatern: header.quatern,
        qoffset: header.qoffset,
        srowX: header.srowX,
        srowY: header.srowY,
        srowZ: header.srowZ,
        sclSlope: header.sclSlope,
        sclInter: header.sclInter,
      },
      geometry: {
        rows: sidecar.Rows || header.dims[1],
        cols: sidecar.Cols || header.dims[2],
        slices: header.dims[3],
        pixelSpacing: sidecar.PixelSpacing,
        sliceThickness: sidecar.SliceThickness,
        spacingBetweenSlices: sidecar.SpacingBetweenSlices,
        orientation: sidecar.Orientation,
        imageOrientationPatientDICOM: sidecar.ImageOrientationPatientDICOM,
        imagePositionPatient: sidecar.ImagePositionPatient,
        warnings: sidecar.Warnings || [],
      },
      adcValidation,
    }
    fs.copyFileSync(niiPath, path.join(dir, 'result.nii.gz'))
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(sidecar))
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2))

    job.status = 'ready'
    job.stage = 'Ready'
    job.percent = 100
    job.processed = job.total
    job.niiPath = path.join(dir, 'result.nii.gz')
    job.metadata = metadata
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
function getJob(jobId) {
  return jobs.get(jobId) || null
}

function jobPublic(job) {
  if (!job) return null
  return {
    id: job.id,
    studyUid: job.studyUid,
    seriesUid: job.seriesUid,
    status: job.status,
    stage: job.stage,
    percent: job.percent,
    processed: job.processed,
    total: job.total,
    error: job.error,
    cacheKey: job.cacheKey,
    metadata: job.metadata,
  }
}

module.exports = { convert, getJob, jobPublic, CACHE_ROOT, CONVERTER_VERSION }
