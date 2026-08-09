const axios = require("axios");
const FormData = require("form-data");
const moment = require("moment");
const JSZip = require("jszip");

/**
 * Sanitize DICOM PatientName (0010,0010) inside a media-extended zip.
 * The PADI-AI Flask app builds filesystem paths from the patient name;
 * a "/" (e.g. Malaysian "A/L", "BINTI") makes it crash with HTTP 500.
 * We replace "/" and "\" with "-" (same byte length, safe binary patch)
 * in every DICOM inside the zip, then re-zip.
 */
async function sanitizePatientNameInZip(zipBuffer) {
  const zip = await JSZip.loadAsync(zipBuffer);
  const out = new JSZip();
  let patched = 0;

  const patchPromises = Object.keys(zip.files).map(async (name) => {
    const entry = zip.files[name];
    if (entry.dir) {
      out.folder(name);
      return;
    }
    const buf = await entry.async("nodebuffer");
    // Only patch DICOM-ish files (has DICM magic)
    const hasDicom = buf.length > 132 && buf.slice(128, 132).toString() === "DICM";
    const patchedBuf = hasDicom ? patchPatientName(buf) : buf;
    if (patchedBuf !== buf) patched++;
    out.file(name, patchedBuf);
  });

  await Promise.all(patchPromises);
  const newZip = await out.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return { zip: newZip, patched };
}

/**
 * Binary patch: replace 0x2F ('/') and 0x5C ('\\') with 0x2D ('-')
 * inside the PatientName (0010,0010) tag value.
 * Handles Explicit VR (PN + 2-byte length) and Implicit VR (4-byte length).
 * Returns a new buffer if patched, else the original.
 */
function patchPatientName(buf) {
  const original = buf;
  buf = Buffer.from(buf); // copy
  let changed = false;

  // Explicit VR little endian: 10 00 10 00 50 4E <len2> <value>
  // Implicit VR little endian: 10 00 10 00 <len4> <value>
  const needle = Buffer.from([0x10, 0x00, 0x10, 0x00]); // (0010,0010)
  let idx = 132; // start after DICM header
  while (idx + 8 <= buf.length) {
    idx = buf.indexOf(needle, idx);
    if (idx === -1) break;

    let valueStart, valueLen;
    const vr = buf.slice(idx + 4, idx + 6).toString();
    if (vr === "PN") {
      // Explicit VR: 2-byte length at idx+6
      valueLen = buf.readUInt16LE(idx + 6);
      valueStart = idx + 8;
    } else if (/^[A-Z0-9]{2}$/.test(vr)) {
      // Some other explicit VR tag with same group/element? skip safely
      idx += 4;
      continue;
    } else {
      // Implicit VR: 4-byte length at idx+4
      valueLen = buf.readUInt32LE(idx + 4);
      valueStart = idx + 8;
    }

    if (valueLen === 0xffffffff || valueStart + valueLen > buf.length) {
      break;
    }

    for (let i = valueStart; i < valueStart + valueLen; i++) {
      if (buf[i] === 0x2f || buf[i] === 0x5c) {
        buf[i] = 0x2d;
        changed = true;
      }
    }
    break; // only the first (0010,0010) occurrence matters
  }

  return changed ? buf : original;
}

const GenerateSeries = async (cookies, url, series, studyID, name, SeriesDescription, modality) => {
  function getBase64(url) {
    return axios
      .get(url, {
        responseType: "arraybuffer",
      })
      .then((response) =>
        Buffer.from(response.data, "binary").toString("base64")
      );
  }
  try {
    const response = await axios({
      url: `http://127.0.0.1:4000/api/tools/create-media-extended/`, // replace with your download URL
      method: "POST", // POST method for downloading
      responseType: "arraybuffer",
      data: {
        Synchronous: true,
        Resources: series,
      },
      headers: {
        "Content-Type": "application/json", // or any other content type you need
        "systemtoken": cookies.tokenOrthancJs
      },
    });
    // Sanitize patient names inside the zip before sending to the AI app
    let uploadZip = response.data;
    try {
      const { zip, patched } = await sanitizePatientNameInZip(response.data);
      uploadZip = zip;
      if (patched > 0) {
        console.log(`[generateAISeries] sanitized PatientName in ${patched} DICOM file(s)`);
      }
    } catch (zipErr) {
      console.log("[generateAISeries] zip sanitize skipped:", zipErr.message);
    }

    let formData = new FormData();
    formData.append("file", uploadZip, "downloaded-file.zip");
    let temp_url = url
      .replace("127.0.0.1", "host.docker.internal")
      .replace("localhost", "host.docker.internal");
    let aiResponse = await axios.post(temp_url + "/api/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Content-Length": formData.getLengthSync(),
      },
    });
    if (!aiResponse.data?.processed_images?.length) {
      toast.error("No images processed");
    }
    let payload = [];
    let images = [];
    if (aiResponse.data?.processed_images) {
      images = aiResponse.data?.processed_images.sort((a, b) => {
        let numA = parseInt(a.match(/IM(\d+)_processed\.jpg/)?.[1]||a.match(/IM(\d+)_summary\.jpg/)?.[1]);
        let numB = parseInt(b.match(/IM(\d+)_processed\.jpg/)?.[1]||b.match(/IM(\d+)_summary\.jpg/)?.[1]);
        return numA - numB;
      });
    }
    for (let processedImage of images) {
      let base64 = await getBase64(temp_url + "/" + processedImage);
      base64 = "data:image/jpeg;base64," + base64;
      payload.push({ Content: base64 });
    }
    await axios.post("http://localhost:4000/api/tools/create-dicom", {
      Content: payload,
      Parent: studyID,
      SeriesDescription: `${SeriesDescription||'NEW'} (${name||'AI'} ${moment().format("DD-MMM-YYYY HH:mm A")})`,
      SOPClassUID: "1.2.840.10008.5.1.4.1.1.7",
      Tags: {
        SeriesDescription: `${SeriesDescription||'NEW'} (${name||'AI'} ${moment().format("DD-MMM-YYYY HH:mm A")})`,
        SOPClassUID: "1.2.840.10008.5.1.4.1.1.7",
        Modality:modality||"DX",
      },
    },{
        headers: {
            "Content-Type": "application/json",
            "systemtoken":cookies.tokenOrthancJs
        }
    });
    let folderName = aiResponse.data.processed_images[0].split("/")[1];
    await axios.delete(temp_url + "/api/uploads", {
      data: { files: [folderName] },
    });
  } catch (err) {
     throw new Error(err)
  }
};

module.exports = GenerateSeries;
module.exports.sanitizePatientNameInZip = sanitizePatientNameInZip;
module.exports.patchPatientName = patchPatientName;
