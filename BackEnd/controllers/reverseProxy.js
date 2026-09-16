const ReverseProxy = require("../model/ReverseProxy");
const got = require("got");
const Options = require("../model/Options");
const { patchDicomTags, transformPatientID, transformPatientName, findTag, setPatientID } = require("../utils/dicomPatcher");

// Series-thumbnail cache: Orthanc REGENERATES previews for huge multi-frame
// XA objects on every request (~1.5-5s each), so a 15-series study browser
// render stalls. Cache the JPEG bytes in memory (30 min TTL) — generation
// cost is paid once per series.
const THUMBNAIL_CACHE_TTL_MS = 30 * 60 * 1000;
const THUMBNAIL_CACHE_MAX_ENTRIES = 2000;
const thumbCache = new Map();

function buildOrthancBufferedOptions(method, api, extraHeaders) {
  const o = Options.getOrthancConnexionSettings();
  const serverString = o.orthancAddress + ":" + o.orthancPort + api;
  const headers = {
    Forwarded:
      "by=localhost;for=localhost;host=" +
      process.env.DOMAIN_ADDRESS +
      "/api;proto=" +
      process.env.DOMAIN_PROTOCOL,
  };
  if (extraHeaders && extraHeaders.Accept) {
    headers["Accept"] = extraHeaders.Accept;
  }
  return {
    method,
    url: serverString,
    headers,
    username: o.orthancUsername,
    password: o.orthancPassword,
    responseType: "buffer",
  };
}

// If a DICOM instance has no PatientID (0010,0020), auto-derive one from its
// PatientName (0010,0010) so studies are grouped under a real patient instead
// of showing up as "Multiple Patients". e.g. "PT 41" -> "PT41".
// Leaves the DICOM untouched when PatientID is already present.
function ensurePatientID(dicomBuffer) {
  if (!dicomBuffer || !dicomBuffer.length) return dicomBuffer;
  const buf = Buffer.from(dicomBuffer);

  // If PatientID is present AND non-empty, leave untouched.
  const idInfo = findTag(buf, 0x0010, 0x0020);
  if (idInfo) {
    const currentID = buf
      .toString('ascii', idInfo.dataOffset, idInfo.dataOffset + idInfo.valueLength)
      .replace(/\x00/g, '')
      .trim();
    if (currentID) return buf; // already has an ID
  }

  // Derive a new ID from PatientName
  const nameInfo = findTag(buf, 0x0010, 0x0010);
  if (!nameInfo) return buf;

  const name = buf
    .toString('ascii', nameInfo.dataOffset, nameInfo.dataOffset + nameInfo.valueLength)
    .replace(/\x00/g, '')
    .trim();
  if (!name) return buf; // nothing to derive from

  const newID = name.replace(/[\s^]/g, '');
  if (!newID) return buf;

  console.log('[reverseProxy] PatientID missing/empty \u2014 deriving "' + newID + '" from PatientName "' + name + '"');
  return setPatientID(buf, newID);
}

const reverseProxyGet = async function (req, res) {
  const apiAdress = req.originalUrl;
  let orthancCalledApi = apiAdress.replace("/api", "");
  // Orthanc WADO returns JPEG thumbnail by default; force full DICOM
  if (orthancCalledApi.startsWith('/wado')) {
    const sep = orthancCalledApi.includes('?') ? '&' : '?';
    orthancCalledApi += sep + 'contentType=application/dicom';
  }
  // Forward the client's Accept header (WADO-RS transfer-syntax preference)
  // so Orthanc can transcode frames (e.g. JPEG-LS) on the fly.
  const extraHeaders = req.headers && req.headers.accept
    ? { Accept: req.headers.accept }
    : undefined;

  // Series/instance-level thumbnail → serve from in-memory cache when
  // possible. The viewer requests instance-level thumbnails with a
  // ?viewport=… query param; normalize the query away (same content).
  const pathOnly = orthancCalledApi.split('?')[0];
  if (/^\/dicom-web\/studies\/[^/]+\/series\/[^/]+(\/instances\/[^/]+)?\/thumbnail$/.test(pathOnly)) {
    const cacheKey = pathOnly;
    const hit = thumbCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < THUMBNAIL_CACHE_TTL_MS) {
      res.setHeader('Content-Type', hit.contentType);
      res.setHeader('Cache-Control', 'private, max-age=1800');
      return res.send(hit.body);
    }
    try {
      const resp = await got(buildOrthancBufferedOptions("GET", pathOnly, extraHeaders));
      if (resp.statusCode === 200) {
        const contentType = resp.headers['content-type'] || 'image/jpeg';
        thumbCache.set(cacheKey, { body: resp.body, contentType, ts: Date.now() });
        if (thumbCache.size > THUMBNAIL_CACHE_MAX_ENTRIES) {
          const oldest = thumbCache.keys().next().value;
          thumbCache.delete(oldest);
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'private, max-age=1800');
        return res.send(resp.body);
      }
      if (!res.headersSent) res.status(resp.statusCode).send(resp.statusMessage);
    } catch (error) {
      if (!res.headersSent) res.status(502).send('Orthanc unreachable');
      console.error('ReverseProxy thumbnail error:', error.message);
    }
    return;
  }

  await ReverseProxy.streamToRes(orthancCalledApi, "GET", undefined, res, extraHeaders);
};
const reverseProxyGetStudy = async function (ID) {
  const apiAdress = `/api/studies/${ID}`
  const orthancCalledApi = apiAdress.replace("/api", "");
  return  ReverseProxy.streamToResFunction(orthancCalledApi, "GET", undefined);
};

const reverseProxyPost = async function (req, res) {
  const apiAdress = req.originalUrl;
  const orthancCalledApi = apiAdress.replace("/api", "");
  await ReverseProxy.streamToRes(orthancCalledApi, "POST", req.body, res);
};

const reverseProxyPostUploadDicom = function (req, res) {
  const apiAdress = req.originalUrl;
  // Strip the query string (Capture Image sends ?studyInstanceUID= for the
  // external-auth scope check) — Orthanc doesn't need it.
  const orthancCalledApi = apiAdress.replace("/api", "").split("?")[0];
  let dicomData = req.body;

  // DISABLED 2026-08-18 (Anas): keep original PatientName/PatientID on manual upload.
  // The v1.26 transform forced PatientName → "CT BRAIN LVO" and rewrote PatientID
  // (+161 / 09-prefix). Backup: controllers/reverseProxy.js.bak-patient-transform
  // (restore by copying the backup over this file and restarting padipacs).
  //
  // if (Buffer.isBuffer(dicomData) && dicomData.length > 132) {
  //   ... original patching logic ...
  // }

  // Auto-derive PatientID only when missing/empty (never overwrite existing).
  try {
    dicomData = ensurePatientID(dicomData);
  } catch (err) {
    console.error('[reverseProxy] ensurePatientID failed, passing through:', err.message);
  }

  ReverseProxy.streamToResUploadDicom(orthancCalledApi, "POST", dicomData, res);
};

const reverseProxyDelete = async function (req, res) {
  const apiAdress = req.originalUrl;
  const orthancCalledApi = apiAdress.replace("/api", "");
  await ReverseProxy.streamToRes(orthancCalledApi, "DELETE", undefined, res);
};

const reverseProxyPut = async function (req, res) {
  const apiAdress = req.originalUrl;
  const orthancCalledApi = apiAdress.replace("/api", "");
  await ReverseProxy.streamToRes(orthancCalledApi, "PUT", req.body, res);
};

const reverseProxyPutPlainText = async function (req, res) {
  const apiAdress = req.originalUrl;
  const orthancCalledApi = apiAdress.replace("/api", "");
  await ReverseProxy.streamToResPlainText(
    orthancCalledApi,
    "PUT",
    req.body,
    res
  );
};

async function warmSeriesThumbnail(orthancCalledApi) {
  // Fill the in-memory series-thumbnail cache (used by the preload service so
  // the first study-browser render after preload is instant).
  if (thumbCache.has(orthancCalledApi)) return;
  try {
    const resp = await got(buildOrthancBufferedOptions("GET", orthancCalledApi, undefined));
    if (resp.statusCode === 200) {
      thumbCache.set(orthancCalledApi, {
        body: resp.body,
        contentType: resp.headers['content-type'] || 'image/jpeg',
        ts: Date.now(),
      });
    }
  } catch (e) {
    // best-effort — thumbnail generation happens on first real request anyway
  }
}

module.exports = {
  reverseProxyGet,
  reverseProxyPost,
  reverseProxyPostUploadDicom,
  reverseProxyPut,
  reverseProxyPutPlainText,
  reverseProxyDelete,
  reverseProxyGetStudy,
  warmSeriesThumbnail,
};

