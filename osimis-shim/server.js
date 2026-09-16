/**
 * OSIMIS Web Viewer — arm64-native data API shim.
 *
 * Reimplements the C++ OSIMIS plugin's HTTP layer (amd64-only .so) as a small
 * Express server that proxies Orthanc. Serves static viewer assets + a dynamic
 * config.js + the data endpoints:
 *   /osimis-viewer/studies/{id}
 *   /osimis-viewer/series/{id}
 *   /osimis-viewer/images/{instance}/{frame}/{quality}   (KLV binary)
 *   /osimis-viewer/languages/{lang}
 *
 * Image response = OSIMIS custom KLV: repeated [uint32 key][uint32 len][value]
 *   keys: 0 Height, 1 Width, 2 SizeInBytes, 3 MinPixelValue,
 *         4 MaxPixelValue, 5 Stretched, 6 ImageBinary (PNG)
 */
const express = require('express');
const zlib = require('zlib');
const path = require('path');

const ORTHANC = (process.env.ORTHANC_URL || 'http://localhost:8476').replace(/\/+$/, '');
const PORT = parseInt(process.env.PORT || '8483', 10);
const ASSETS = process.env.ASSETS || path.join(__dirname, 'assets');

const app = express();
app.disable('x-powered-by');

// request log (debug)
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`));
  next();
});

// ---------------------------------------------------------------- orthanc helpers
async function orthancJson(p) {
  const r = await fetch(ORTHANC + p, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Orthanc ${p} -> ${r.status}`);
  return r.json();
}
async function orthancBuffer(p) {
  const r = await fetch(ORTHANC + p);
  if (!r.ok) throw new Error(`Orthanc ${p} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// ---------------------------------------------------------------- minimal PNG encoder
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
// rawPixelsBE = big-endian grayscale pixel bytes (1 byte/px @8-bit, 2 bytes/px @16-bit)
function encodeGrayscalePng(width, height, rawPixelsBE, bitDepth) {
  const bpp = bitDepth === 16 ? 2 : 1;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = bitDepth;   // bit depth
  ihdr[9] = 0;          // color type: grayscale
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = width * bpp;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rawPixelsBE.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
// swap little-endian uint16 -> big-endian in place (returns new buffer)
function swap16LEtoBE(buf) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i += 2) {
    out[i] = buf[i + 1];
    out[i + 1] = buf[i];
  }
  return out;
}

// ---------------------------------------------------------------- KLV
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0, 0); return b; }
function i32(n) { const b = Buffer.alloc(4); b.writeInt32BE(n | 0, 0); return b; }
function klvEntry(key, val) { return Buffer.concat([u32(key), u32(val.length), val]); }
function buildKLV({ height, width, sizeInBytes, minPixelValue, maxPixelValue, stretched, imageBinary }) {
  return Buffer.concat([
    klvEntry(0, u32(height)),
    klvEntry(1, u32(width)),
    klvEntry(2, u32(sizeInBytes)),
    klvEntry(3, i32(minPixelValue)),
    klvEntry(4, i32(maxPixelValue)),
    klvEntry(5, u32(stretched ? 1 : 0)),
    klvEntry(6, imageBinary),
  ]);
}

// ---------------------------------------------------------------- DICOM tags the viewer reads
const TAG_NAMES = [
  'Columns', 'Rows',
  'WindowCenter', 'WindowWidth',
  'PixelSpacing', 'ImagerPixelSpacing', 'SliceLocation', 'SliceThickness',
  'RecommendedDisplayFrameRate', 'MIMETypeOfEncapsulatedDocument',
  'PhotometricInterpretation', 'PixelRepresentation',
  'BitsStored', 'BitsAllocated', 'SamplesPerPixel',
  'RescaleSlope', 'RescaleIntercept',
  'InstanceNumber', 'SOPInstanceUID',
  // instance-level display tags (bottom-left overlay)
  'PatientOrientation', 'ImageLaterality', 'ViewPosition',
  // series-level tags (series list title + overlay)
  'SeriesDescription', 'SeriesNumber', 'SeriesDate', 'SeriesTime',
  // study-level tags (overlay top-right)
  'StudyDescription', 'StudyDate', 'StudyTime',
  // patient-level tags (overlay top-left)
  'PatientName', 'PatientID', 'PatientBirthDate', 'PatientSex',
  'Modality',
];
function pickTags(simplified) {
  const out = {};
  for (const k of TAG_NAMES) {
    const v = simplified[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// uncompressed transfer syntaxes where frames/{n}/raw yields raw pixels
const RAW_TS = new Set([
  '1.2.840.10008.1.2',      // Implicit VR LE
  '1.2.840.10008.1.2.1',    // Explicit VR LE
  '1.2.840.10008.1.2.2',    // Deflated Explicit VR LE
  '1.2.840.10008.1.2.1.99', // Deflated Implicit VR LE
]);

const instanceCache = new Map(); // instanceId -> { tagsSubset, transferSyntax, bitsAllocated, photometric, samplesPerPixel }

// ---------------------------------------------------------------- config.js
app.get('/osimis-viewer/config.js', (req, res) => {
  const cfg = {
    version: '1.3.1',
    defaultLanguage: 'en',
    dateFormat: 'DD/MM/YYYY',
    // #6 view previous studies for the same patient
    openAllPatientStudies: true,
    // #5 move patient/study info into the viewport overlay (hide top breadcrumb)
    showStudyInformationBreadcrumb: false,
    showNoReportIconInSeriesList: false,
    reduceTimelineHeightOnSingleFrameSeries: false,
    toolbarLayoutMode: 'flat',
    toolbarButtonSize: 'small',
    defaultSelectedTool: 'zoom',
    defaultStudyIslandsDisplayMode: 'grid',
    windowingPresets: {},
    // #3 remove "Not for diagnostic usage" warning
    alwaysShowNotForDiagnosticUsageDisclaimer: false,
    // #10 reference lines between synchronized viewports
    referenceLinesEnabled: true,
    synchronizedBrowsingEnabled: true,
    crossHairEnabled: true,
    // #5 show patient/study info as overlay text on the image
    displayOverlayText: true,
    displayOverlayIcons: true,
    toggleOverlayTextButtonEnabled: true,
    toggleOverlayIconsButtonEnabled: true,
    printEnabled: false,
    customCommandEnabled: false,
    customCommandIconLabel: '',
    customCommandIconClass: '',
    customOverlayProviderUrl: '',
    studyDownloadEnabled: true,
    videoDisplayEnabled: false,
    annotationStorageEnabled: true,
    keyImageCaptureEnabled: true,
    showInfoPopupButtonEnabled: true,
    showInfoPopupAtStartup: 'never',
    downloadAsJpegEnabled: true,
    combinedToolEnabled: false,
  };
  res.type('application/javascript');
  res.send('window.__webViewerConfig = ' + JSON.stringify(cfg) + ';\n');
});

// ---------------------------------------------------------------- static assets
app.use('/osimis-viewer/app', express.static(ASSETS, { index: 'index.html' }));

// ---------------------------------------------------------------- languages
app.get('/osimis-viewer/languages/:lang', (req, res) => {
  const lang = req.params.lang.replace(/[^a-zA-Z]/g, '');
  res.sendFile(path.join(ASSETS, 'languages', lang + '.json'));
});

// ---------------------------------------------------------------- studies
app.get('/osimis-viewer/studies/:id', async (req, res) => {
  try { res.json(await orthancJson('/studies/' + req.params.id)); }
  catch (e) { res.status(404).json({ error: e.message }); }
});

// ---------------------------------------------------------------- series (reformatted)
app.get('/osimis-viewer/series/:id', async (req, res) => {
  const seriesId = req.params.id;
  try {
    const series = await orthancJson('/series/' + seriesId);
    const instances = await orthancJson('/series/' + seriesId + '/instances');
    const studyId = series.ParentStudy;

    const instancesInfos = {};
    const instancesList = [];
    const infosArray = [];

    for (const inst of instances) {
      const instanceId = inst.ID;
      const main = inst.MainDicomTags || {};
      const frameCount = (inst.NumberOfFrames && parseInt(inst.NumberOfFrames, 10)) || 1;

      let simplified = {};
      let transferSyntax = '1.2.840.10008.1.2';
      try {
        simplified = await orthancJson('/instances/' + instanceId + '/tags?simplify');
        const hdr = await orthancJson('/instances/' + instanceId + '/header?simplify');
        transferSyntax = hdr['TransferSyntaxUID'] || '1.2.840.10008.1.2';
      } catch (_) {}

      const tagsSubset = Object.assign({}, pickTags(main), pickTags(simplified));
      const info = { TagsSubset: tagsSubset, TransferSyntax: transferSyntax, Id: instanceId };

      instancesInfos[instanceId] = info;
      infosArray.push(info);
      instancesList.push([instanceId, simplified['SOPInstanceUID'] || main['SOPInstanceUID'] || null, frameCount]);

      instanceCache.set(instanceId, {
        tagsSubset,
        transferSyntax,
        bitsAllocated: parseInt(tagsSubset['BitsAllocated'] || main['BitsAllocated'] || '16', 10),
        photometric: tagsSubset['PhotometricInterpretation'] || main['PhotometricInterpretation'] || 'MONOCHROME2',
        samplesPerPixel: parseInt(tagsSubset['SamplesPerPixel'] || main['SamplesPerPixel'] || '1', 10),
      });
    }

    const mid = infosArray[Math.floor(infosArray.length / 2)] || { TagsSubset: {}, TransferSyntax: '1.2.840.10008.1.2' };

    res.json({
      skipped: 0,
      instancesInfos,
      study: { ID: studyId },
      contentType: 'image',
      studyId,
      middleInstanceInfos: { TagsSubset: mid.TagsSubset, TransferSyntax: mid.TransferSyntax },
      instances: instancesList,
      availableQualities: ['LOSSLESS'],
      id: seriesId,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------- images (KLV)
app.get('/osimis-viewer/images/:instance/:frame/:quality', async (req, res) => {
  const instanceId = req.params.instance;
  const frame = parseInt(req.params.frame || '0', 10);
  // quality endpoint ignored for v1 (only LOSSLESS -> high-quality PNG)

  try {
    let meta = instanceCache.get(instanceId);
    if (!meta) {
      let simplified = {};
      let transferSyntax = '1.2.840.10008.1.2';
      try {
        simplified = await orthancJson('/instances/' + instanceId + '/tags?simplify');
        const hdr = await orthancJson('/instances/' + instanceId + '/header?simplify');
        transferSyntax = hdr['TransferSyntaxUID'] || '1.2.840.10008.1.2';
      } catch (_) {}
      meta = {
        tagsSubset: pickTags(simplified),
        transferSyntax,
        bitsAllocated: parseInt(simplified['BitsAllocated'] || '16', 10),
        photometric: simplified['PhotometricInterpretation'] || 'MONOCHROME2',
        samplesPerPixel: parseInt(simplified['SamplesPerPixel'] || '1', 10),
      };
      instanceCache.set(instanceId, meta);
    }

    const width = parseInt(meta.tagsSubset['Columns'] || '0', 10);
    const height = parseInt(meta.tagsSubset['Rows'] || '0', 10);
    const bitsAllocated = meta.bitsAllocated;
    const photometric = meta.photometric;
    const isMono = photometric === 'MONOCHROME1' || photometric === 'MONOCHROME2';
    const bitsStored = parseInt(meta.tagsSubset['BitsStored'] || String(bitsAllocated), 10);

    let imageBinary;
    let sizeInBytes;
    let minPixelValue = 0;
    let maxPixelValue = (1 << Math.max(bitsStored, 8)) - 1;
    if (isMono && bitsStored > 8) maxPixelValue = (1 << bitsStored) - 1;
    if (!isMono) maxPixelValue = 255;
    const stretched = false;

    if (isMono && RAW_TS.has(meta.transferSyntax)) {
      // raw pixel data, little-endian, uncompressed
      const raw = await orthancBuffer(`/instances/${instanceId}/frames/${frame}/raw`);
      const bitDepth = bitsAllocated > 8 ? 16 : 8;
      const bpp = bitDepth === 16 ? 2 : 1;
      sizeInBytes = width * height * bpp;
      const be = bitDepth === 16 ? swap16LEtoBE(raw) : raw;
      imageBinary = encodeGrayscalePng(width, height, be, bitDepth);
    } else {
      // RGB or compressed -> use Orthanc rendered PNG (8-bit)
      const rendered = await orthancBuffer(`/instances/${instanceId}/rendered`);
      imageBinary = rendered;
      sizeInBytes = width * height * (isMono ? 2 : 4);
      maxPixelValue = 255;
    }

    const klv = buildKLV({ height, width, sizeInBytes, minPixelValue, maxPixelValue, stretched, imageBinary });
    res.type('application/octet-stream');
    res.send(klv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------- annotations (v1 empty) / custom-command
app.get('/osimis-viewer/studies/:id/annotations', (req, res) => res.json({}));
app.get('/osimis-viewer/images/:instance/:frame/annotations', (req, res) => res.json({}));
app.put('/osimis-viewer/images/:instance/:frame/annotations', express.json(), (req, res) => res.json({}));
app.get('/osimis-viewer/custom-command', (req, res) => res.json({}));
app.post('/osimis-viewer/custom-command/:id', express.json(), (req, res) => res.json({}));

// ---------------------------------------------------------------- catch-all: proxy plain Orthanc REST endpoints
// The frontend calls many plain Orthanc routes (e.g. /studies/{id}, /instances/{id}/pdf,
// /instances/{id}/frames/{n}/raw, /patients/{id}, /tools/create-dicom) against orthancApiURL
// (which resolves to this shim's origin). Forward those to Orthanc.
app.use(express.raw({ type: () => true, limit: '512mb' }), async (req, res) => {
  try {
    const headers = {};
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body && req.body.length;
    const r = await fetch(ORTHANC + req.originalUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
    });
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.set('content-type', ct);
    res.send(buf);
  } catch (e) {
    res.status(502).json({ error: 'proxy: ' + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`OSIMIS shim on :${PORT} -> Orthanc ${ORTHANC}`);
  console.log(`Assets: ${ASSETS}`);
});
