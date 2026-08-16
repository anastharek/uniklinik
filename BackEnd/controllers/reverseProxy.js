const ReverseProxy = require("../model/ReverseProxy");
const { patchDicomTags, transformPatientID, transformPatientName } = require("../utils/dicomPatcher");

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
  const orthancCalledApi = apiAdress.replace("/api", "");
  let dicomData = req.body;

  // Transform PatientName and PatientID in DICOM binary before uploading to Orthanc.
  // This ensures Orthanc, PadiMedical database, and the upload UI all show transformed values.
  if (Buffer.isBuffer(dicomData) && dicomData.length > 132) {
    const isDICOM = dicomData.toString('ascii', 128, 132) === 'DICM';
    if (isDICOM) {
      try {
        const { findTag } = require("../utils/dicomPatcher");
        const nameTag = findTag(dicomData, 0x0010, 0x0010);
        if (nameTag) {
          const currentName = dicomData.toString('ascii', nameTag.dataOffset, nameTag.dataOffset + nameTag.valueLength).replace(/\x00|\x20/g, '').trim();
          // Only transform if not already transformed (prevents double-processing)  
          if (currentName !== 'CT BRAIN LVO') {
            console.log(`[reverseProxy] Transforming PatientName: "${currentName}" → "CT BRAIN LVO"`);
            const idTag = findTag(dicomData, 0x0010, 0x0020);
            if (idTag) {
              const currentID = dicomData.toString('ascii', idTag.dataOffset, idTag.dataOffset + idTag.valueLength).replace(/\x00|\x20/g, '').trim();
              const newID = transformPatientID(currentID);
              console.log(`[reverseProxy] Transforming PatientID: "${currentID}" → "${newID}"`);
              dicomData = patchDicomTags(dicomData, 'CT BRAIN LVO', newID);
            } else {
              dicomData = patchDicomTags(dicomData, 'CT BRAIN LVO', '');
            }
          }
        }
      } catch (err) {
        console.error('[reverseProxy] DICOM patching failed:', err.message);
        // Continue with original DICOM on failure (fail-safe)
      }
    }
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

module.exports = {
  reverseProxyGet,
  reverseProxyPost,
  reverseProxyPostUploadDicom,
  reverseProxyPut,
  reverseProxyPutPlainText,
  reverseProxyDelete,
  reverseProxyGetStudy,
};

