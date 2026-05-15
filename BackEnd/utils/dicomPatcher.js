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
  // Meta header is always Explicit VR LE. Scan for (0002,0010)
  const tagBytes = Buffer.from([0x02, 0x00, 0x10, 0x00]); // (0002,0010) LE
  let offset = 132; // After preamble + DICM
  
  while (offset < buf.length - 8) {
    const group = buf.readUInt16LE(offset);
    if (group !== 0x0002) break; // Left meta header, (0002,0010) not found
    
    if (buf[offset] === tagBytes[0] && buf[offset + 1] === tagBytes[1] &&
        buf[offset + 2] === tagBytes[2] && buf[offset + 3] === tagBytes[3]) {
      // Found (0002,0010) — read its value
      const vr = buf.toString('ascii', offset + 4, offset + 6);
      const valueLength = buf.readUInt16LE(offset + 6);
      const value = buf.toString('ascii', offset + 8, offset + 8 + valueLength).replace(/\x00/g, '').trim();
      // 1.2.840.10008.1.2 = Implicit VR LE (default DICOM)
      return value === '1.2.840.10008.1.2' ? 'IMPLICIT' : 'EXPLICIT';
    }
    
    // Advance past this meta header tag (Explicit VR)
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
      break; // Invalid VR
    }
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

module.exports = {
  extractDigits,
  transformPatientID,
  transformPatientName,
  findTag,
  patchDicomTags,
};
