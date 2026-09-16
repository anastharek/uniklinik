/**
 * dicomPatcher.js - Transform PatientName and PatientID in DICOM binary
 * before uploading to Orthanc. Ensures PadiMedical displays transformed values.
 */
'use strict';

/**
 * Extract all digit characters from a string.
 * e.g. "USM0000007" → "0000007", "ABC-00045" → "00045", "HUKM123ABC" → "123"
 */
function extractDigits(str) {
  if (!str) return '';
  const digits = str.replace(/\D/g, '');
  return digits;
}

/**
 * Transform PatientID according to rule:
 *   ExtractDigits(originalID) → tonumber → +161 → prefix "09" → 7-digit zero-pad
 *   e.g. "USM0000007" → "090000168"
 */
function transformPatientID(originalID) {
  if (!originalID) return '';
  const digits = extractDigits(originalID);
  if (!digits) return originalID;
  const num = parseInt(digits, 10);
  if (isNaN(num)) return originalID;
  const newNum = num + 161;
  const padded = String(newNum).padStart(7, '0');
  return '09' + padded;
}

/**
 * Transform PatientName → "CT BRAIN LVO"
 */
function transformPatientName() {
  return 'CT BRAIN LVO';
}

// VRs that use 4-byte length in Explicit VR (always, regardless of transfer syntax)
const VR_32BIT = ['OB', 'OD', 'OF', 'OL', 'OW', 'SQ', 'UC', 'UN', 'UR', 'UT'];

/**
 * Read (0002,0010) TransferSyntaxUID to determine data set encoding.
 * Returns 'EXPLICIT' or 'IMPLICIT'. Defaults to IMPLICIT if not found.
 */
function detectDataTransferSyntax(buf) {
  // Meta header is always Explicit VR LE. Walk it to find the TransferSyntaxUID
  // (0002,0010) and the start of the data set.
  const tagBytes = Buffer.from([0x02, 0x00, 0x10, 0x00]); // (0002,0010) LE
  let offset = 132; // After preamble + DICM
  let tsValue = null;
  let datasetStart = null;

  while (offset < buf.length - 8) {
    const group = buf.readUInt16LE(offset);
    if (group !== 0x0002) {
      datasetStart = offset;
      break;
    }

    const vr = buf.toString('ascii', offset + 4, offset + 6);
    let valueLength, valueOffset;
    if (/^[A-Z]{2}$/.test(vr)) {
      if (VR_32BIT.includes(vr)) {
        valueLength = buf.readUInt32LE(offset + 8);
        valueOffset = offset + 12;
      } else {
        valueLength = buf.readUInt16LE(offset + 6);
        valueOffset = offset + 8;
      }
    } else {
      break;
    }

    const element = buf.readUInt16LE(offset + 2);
    if (group === 0x0002 && element === 0x0010) {
      tsValue = buf.toString('ascii', valueOffset, valueOffset + valueLength).replace(/\x00/g, '').trim();
    }
    offset = valueOffset + valueLength;
  }

  // Known uncompressed transfer syntaxes
  if (tsValue === '1.2.840.10008.1.2.1' || tsValue === '1.2.840.10008.1.2.2') {
    return 'EXPLICIT';
  }
  if (tsValue === '1.2.840.10008.1.2') {
    return 'IMPLICIT';
  }

  // Compressed (or unknown) transfer syntax: the data-set encoding is ambiguous in
  // practice — the standard mandates Implicit VR LE, but some encoders (e.g. DCMTK)
  // emit Explicit VR LE. Sniff the first data-set tag: if the two bytes after the
  // tag look like a valid VR, the data set is Explicit VR; otherwise Implicit VR.
  if (datasetStart !== null && datasetStart < buf.length - 6) {
    const firstVr = buf.toString('ascii', datasetStart + 4, datasetStart + 6);
    if (/^[A-Z]{2}$/.test(firstVr)) {
      return 'EXPLICIT';
    }
    return 'IMPLICIT';
  }

  return 'IMPLICIT'; // Default
}

/**
 * Scan DICOM buffer for a tag and return its value offset and length.
 * 
 * Handles both Implicit VR LE and Explicit VR LE.
 * In Implicit VR LE: tag(4) + length(4) + value(length)
 * In Explicit VR LE: tag(4) + VR(2) + length(2) + value(length)
 *   (except for OB, OD, OF, OL, OW, SQ, UC, UN, UR, UT: VR(2)+reserved(2)+length(4)+value)
 * 
 * Returns { dataOffset: number, valueLength: number, vr: string } or null if not found.
 */
function findTag(buf, groupHex, elementHex) {
  const startOffset = 132; // After 128-byte preamble + "DICM" (4 bytes)
  
  // Detect data set transfer syntax
  const dataSyntax = detectDataTransferSyntax(buf);
  const dataIsExplicit = dataSyntax === 'EXPLICIT';

  const tagBytes = Buffer.from([groupHex & 0xFF, (groupHex >> 8) & 0xFF, elementHex & 0xFF, (elementHex >> 8) & 0xFF]);
  
  let offset = startOffset;
  while (offset < buf.length - 8) {
    const group = buf.readUInt16LE(offset);
    
    // For meta header (group 0002), always use Explicit VR
    const useExplicit = (group === 0x0002) ? true : dataIsExplicit;
    
    if (buf[offset] === tagBytes[0] && buf[offset + 1] === tagBytes[1] &&
        buf[offset + 2] === tagBytes[2] && buf[offset + 3] === tagBytes[3]) {
      
      if (useExplicit) {
        const vr = buf.toString('ascii', offset + 4, offset + 6);
        if (VR_32BIT.includes(vr)) {
          const valueLength = buf.readUInt32LE(offset + 8);
          return { dataOffset: offset + 12, valueLength, vr };
        } else {
          const valueLength = buf.readUInt16LE(offset + 6);
          return { dataOffset: offset + 8, valueLength, vr };
        }
      } else {
        // Implicit VR LE
        const valueLength = buf.readUInt32LE(offset + 4);
        return { dataOffset: offset + 8, valueLength, vr: null };
      }
    }
    
    // Advance to next tag
    if (useExplicit) {
      const vr = buf.toString('ascii', offset + 4, offset + 6);
      if (/^[A-Z]{2}$/.test(vr)) {
        if (VR_32BIT.includes(vr)) {
          const len = buf.readUInt32LE(offset + 8);
          offset += 12 + len;
        } else {
          const len = buf.readUInt16LE(offset + 6);
          offset += 8 + len;
        }
      } else {
        break; // Invalid data
      }
    } else {
      const valueLength = buf.readUInt32LE(offset + 4);
      offset += 8 + valueLength;
    }
    
    if (offset >= buf.length) break;
  }
  
  return null;
}

/**
 * Build a new DICOM buffer with PatientName and PatientID replaced.
 * Handles all size differences (shorter, longer, or same-length values).
 *
 * @param {Buffer} dicomBuffer - Original DICOM buffer
 * @param {string} newPatientName - New PatientName (e.g. "CT BRAIN LVO")
 * @param {string} newPatientID - New PatientID (e.g. "090000168")
 * @returns {Buffer} - New DICOM buffer with patched tags
 */
function patchDicomTags(dicomBuffer, newPatientName, newPatientID) {
  // Make a mutable copy
  let buf = Buffer.from(dicomBuffer);

  // Helper: compute padded byte length (even, DICOM string VR rule)
  function paddedLen(value) {
    const len = Buffer.byteLength(value, 'ascii');
    return len % 2 === 0 ? len : len + 1;
  }

  // Helper: build padded value bytes
  function paddedBytes(value) {
    const raw = Buffer.from(value, 'ascii');
    if (raw.length % 2 !== 0) {
      const out = Buffer.alloc(raw.length + 1);
      raw.copy(out);
      out[raw.length] = 0x20; // Space pad
      return out;
    }
    return raw;
  }

  // Helper: replace one tag value in the buffer, returning a new buffer
  function replaceTag(buf, groupHex, elementHex, newValue) {
    const info = findTag(buf, groupHex, elementHex);
    if (!info) {
      console.log('[dicomPatcher] Tag (' + groupHex.toString(16) + ',' + elementHex.toString(16) + ') not found');
      return buf;
    }

    const oldValue = buf.toString('ascii', info.dataOffset, info.dataOffset + info.valueLength);
    console.log('[dicomPatcher] Found (' + groupHex.toString(16) + ',' + elementHex.toString(16) + ') at offset ' + info.dataOffset + ': "' + oldValue.trim() + '"');

    const newLen = paddedLen(newValue);
    const oldLen = info.valueLength;
    const dataStart = info.dataOffset;

    // Determine where the length field is
    let lengthOffset;
    let isShortLength; // 2-byte vs 4-byte length field
    let tagStart; // offset of the tag group/element bytes

    if (info.vr) {
      // Explicit VR
      if (VR_32BIT.includes(info.vr)) {
        // VR(2) + reserved(2) + length(4)
        lengthOffset = dataStart - 4;
        tagStart = dataStart - 12;
        isShortLength = false;
      } else {
        // VR(2) + length(2)
        lengthOffset = dataStart - 2;
        tagStart = dataStart - 8;
        isShortLength = true;
      }
    } else {
      // Implicit VR: tag(4) + length(4)
      lengthOffset = dataStart - 4;
      tagStart = dataStart - 8;
      isShortLength = false;
    }

    if (newLen === oldLen) {
      // Same length — simple overwrite
      const val = paddedBytes(newValue);
      val.copy(buf, dataStart);
      return buf;
    }

    // Need to rebuild buffer (different lengths)
    const sizeDelta = newLen - oldLen;
    const newBuf = Buffer.alloc(buf.length + sizeDelta);

    // Copy everything BEFORE the value
    buf.copy(newBuf, 0, 0, dataStart);
    // Write new value
    const valBytes = paddedBytes(newValue);
    valBytes.copy(newBuf, dataStart);
    // Copy everything AFTER the old value
    const afterStart = dataStart + oldLen;
    buf.copy(newBuf, dataStart + newLen, afterStart);

    // Update length field in the new buffer
    if (isShortLength) {
      newBuf.writeUInt16LE(newLen, lengthOffset);
    } else {
      newBuf.writeUInt32LE(newLen, lengthOffset);
    }

    return newBuf;
  }

  // Patch PatientName (0010,0010)
  buf = replaceTag(buf, 0x0010, 0x0010, newPatientName);
  // Patch PatientID (0010,0020)
  buf = replaceTag(buf, 0x0010, 0x0020, newPatientID);

  return buf;
}

/**
 * Insert a new DICOM tag into the buffer at the given offset.
 * Handles Implicit VR LE and Explicit VR LE correctly.
 */
function insertTag(buf, insertOffset, groupHex, elementHex, value, vr) {
  const dataIsExplicit = detectDataTransferSyntax(buf) === 'EXPLICIT';
  const tagBytes = Buffer.from([
    groupHex & 0xFF, (groupHex >> 8) & 0xFF,
    elementHex & 0xFF, (elementHex >> 8) & 0xFF,
  ]);

  // Even-length value (space-padded for odd-length strings)
  let valueBytes = Buffer.from(value, 'ascii');
  if (valueBytes.length % 2 !== 0) {
    const out = Buffer.alloc(valueBytes.length + 1);
    valueBytes.copy(out);
    out[valueBytes.length] = 0x20;
    valueBytes = out;
  }

  let header;
  if (dataIsExplicit) {
    const is32bit = VR_32BIT.includes(vr);
    if (is32bit) {
      header = Buffer.alloc(8);
      Buffer.from(vr, 'ascii').copy(header, 0);
      header.writeUInt32LE(valueBytes.length, 4);
    } else {
      header = Buffer.alloc(4);
      Buffer.from(vr, 'ascii').copy(header, 0);
      header.writeUInt16LE(valueBytes.length, 2);
    }
  } else {
    header = Buffer.alloc(4);
    header.writeUInt32LE(valueBytes.length, 0);
  }

  const newTag = Buffer.concat([tagBytes, header, valueBytes]);
  const newBuf = Buffer.alloc(buf.length + newTag.length);
  buf.copy(newBuf, 0, 0, insertOffset);
  newTag.copy(newBuf, insertOffset);
  buf.copy(newBuf, insertOffset + newTag.length, insertOffset);
  return newBuf;
}

/**
 * Set PatientID (0010,0020), replacing it when present and inserting it when
 * absent (right after PatientName 0010,0010, or at the start of the data set).
 * Returns a new buffer (or the original if nothing to do).
 */
function setPatientID(buf, newID) {
  const idInfo = findTag(buf, 0x0010, 0x0020);

  if (idInfo) {
    // Replace existing value
    const oldLen = idInfo.valueLength;
    const newVal = Buffer.from(newID, 'ascii');
    const newLen = newVal.length + (newVal.length % 2); // even-padded length
    const padded = Buffer.alloc(newLen, 0x20);
    newVal.copy(padded);

    let lengthOffset, isShortLength;
    if (idInfo.vr) {
      if (VR_32BIT.includes(idInfo.vr)) { lengthOffset = idInfo.dataOffset - 4; isShortLength = false; }
      else { lengthOffset = idInfo.dataOffset - 2; isShortLength = true; }
    } else {
      lengthOffset = idInfo.dataOffset - 4; isShortLength = false;
    }

    if (newLen === oldLen) {
      const out = Buffer.from(buf);
      padded.copy(out, idInfo.dataOffset);
      return out;
    }
    const sizeDelta = newLen - oldLen;
    const newBuf = Buffer.alloc(buf.length + sizeDelta);
    buf.copy(newBuf, 0, 0, idInfo.dataOffset);
    padded.copy(newBuf, idInfo.dataOffset);
    buf.copy(newBuf, idInfo.dataOffset + newLen, idInfo.dataOffset + oldLen);
    if (isShortLength) newBuf.writeUInt16LE(newLen, lengthOffset);
    else newBuf.writeUInt32LE(newLen, lengthOffset);
    return newBuf;
  }

  // Insert: place it right after PatientName (0010,0010)
  const nameInfo = findTag(buf, 0x0010, 0x0010);
  const insertOffset = nameInfo
    ? nameInfo.dataOffset + nameInfo.valueLength
    : 132; // fallback: right after the meta header
  return insertTag(buf, insertOffset, 0x0010, 0x0020, newID, 'LO');
}

module.exports = {
  extractDigits,
  transformPatientID,
  transformPatientName,
  findTag,
  patchDicomTags,
  insertTag,
  setPatientID,
};
