/**
 * Derived DICOM writer — "Save as DICOM" for the research module.
 *
 * Builds a NEW Secondary Capture derived series (new SeriesInstanceUID +
 * SOPInstanceUID, same study) that preserves the processed visualization
 * (colormap / threshold overlay / presentation state as rendered). It never
 * touches the original DICOM; the original quantitative data remains the
 * source of truth.
 */
import dcmjs from 'dcmjs';
import { DicomMetadataStore, utils } from '@ohif/core';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const SC_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture
const EXPLICIT_VR_LE = '1.2.840.10008.1.2.1';

export function generateUid() {
  return '2.25.' + utils.uuidv4().replace(/-/g, '');
}

function str(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return String(v[0] || '');
  return String(v);
}

/**
 * Patient/study identity for the derived series — read from the study's
 * INSTANCE metadata (the store's study object lacks patient tags in the
 * normal viewing flow). Same approach as the capture tool fix.
 */
function readIdentity(studyUid) {
  const out = {};
  try {
    const study = DicomMetadataStore.getStudy(studyUid);
    const firstInstance =
      study && study.series && study.series[0] && study.series[0].instances
        ? study.series[0].instances[0]
        : undefined;
    const src = firstInstance || study || {};
    out.patientName = str(src.PatientName) || str(study && study.PatientName);
    out.patientId = str(src.PatientID) || str(study && study.PatientID);
    out.studyDate = str(src.StudyDate) || str(study && study.StudyDate);
    out.studyTime = str(src.StudyTime) || str(study && study.StudyTime);
    out.studyDescription = str(src.StudyDescription) || str(study && study.StudyDescription);
    out.accessionNumber = str(src.AccessionNumber) || str(study && study.AccessionNumber);
    out.studyId = str(src.StudyID) || str(study && study.StudyID);
  } catch (e) {
    console.warn('[NIfTI] study identity lookup failed', e);
  }
  return out;
}

export function buildDerivedScDicom({ name, rows, cols, rgb, studyUid }) {
  const sopUid = generateUid();
  const seriesUid = generateUid();
  const id = readIdentity(studyUid);

  const dataset = {
    SOPClassUID: SC_SOP_CLASS_UID,
    SOPInstanceUID: sopUid,
    StudyInstanceUID: studyUid,
    SeriesInstanceUID: seriesUid,
    PatientName: id.patientName || '',
    PatientID: id.patientId || '',
    StudyDate: id.studyDate || '',
    StudyTime: id.studyTime || '',
    StudyDescription: id.studyDescription || '',
    AccessionNumber: id.accessionNumber || '',
    StudyID: id.studyId || '',
    Modality: 'OT',
    ConversionType: 'WSD',
    SeriesDescription: name,
    SeriesNumber: '9999',
    InstanceNumber: '1',
    SamplesPerPixel: 3,
    PhotometricInterpretation: 'RGB',
    Rows: String(rows),
    Columns: String(cols),
    BitsAllocated: 8,
    BitsStored: 8,
    HighBit: 7,
    PixelRepresentation: 0,
    PixelData: rgb,
  };

  const meta = {
    MediaStorageSOPClassUID: SC_SOP_CLASS_UID,
    MediaStorageSOPInstanceUID: sopUid,
    TransferSyntaxUID: EXPLICIT_VR_LE,
    ImplementationClassUID: '2.25.0.0.1.4.0.0.1',
    ImplementationVersionName: 'PUTRACNS_RESEARCH_1',
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(dataset);
  const dicomDict = new DicomDict(DicomMetaDictionary.denaturalizeDataset(meta));
  dicomDict.dict = denaturalized;
  return { part10: dicomDict.write({ allowInvalidVRLength: false, fragmentMultiframe: false }), sopUid, seriesUid };
}

/** Canvas -> RGB pixel bytes (row-major, RGB24). */
export function canvasToRgb(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const rgb = new Uint8Array(w * h * 3);
  const src = imageData.data;
  for (let p = 0, s = 0; p < src.length; p += 4, s += 3) {
    rgb[s] = src[p];
    rgb[s + 1] = src[p + 1];
    rgb[s + 2] = src[p + 2];
  }
  return rgb;
}

/**
 * Build ONE slice of a multi-slice derived SC series (full-volume export).
 * All slices share `seriesUid`; each gets its own SOPInstanceUID +
 * InstanceNumber, with patient-space geometry from the NIfTI affine so the
 * derived series stacks correctly in any DICOM viewer.
 */
export function buildSliceScDicom({
  name,
  rows,
  cols,
  rgb,
  studyUid,
  seriesUid,
  sopUid,
  instanceNumber,
  imagePositionPatient, // [x, y, z] mm
  imageOrientationPatient, // 6 numbers (row dir, col dir)
  pixelSpacing, // [rowSpacing, colSpacing] mm
  sliceThickness, // mm
}) {
  const id = readIdentity(studyUid);
  const dataset = {
    SOPClassUID: SC_SOP_CLASS_UID,
    SOPInstanceUID: sopUid,
    StudyInstanceUID: studyUid,
    SeriesInstanceUID: seriesUid,
    PatientName: id.patientName || '',
    PatientID: id.patientId || '',
    StudyDate: id.studyDate || '',
    StudyTime: id.studyTime || '',
    StudyDescription: id.studyDescription || '',
    AccessionNumber: id.accessionNumber || '',
    StudyID: id.studyId || '',
    Modality: 'OT',
    ConversionType: 'WSD',
    SeriesDescription: name,
    SeriesNumber: '9999',
    InstanceNumber: String(instanceNumber),
    SamplesPerPixel: 3,
    PhotometricInterpretation: 'RGB',
    Rows: String(rows),
    Columns: String(cols),
    BitsAllocated: 8,
    BitsStored: 8,
    HighBit: 7,
    PixelRepresentation: 0,
    PixelData: rgb,
  };
  if (Array.isArray(imagePositionPatient) && imagePositionPatient.length === 3) {
    dataset.ImagePositionPatient = imagePositionPatient.map(v => String(Number(v).toFixed(3)));
  }
  if (Array.isArray(imageOrientationPatient) && imageOrientationPatient.length === 6) {
    dataset.ImageOrientationPatient = imageOrientationPatient.map(v => String(Number(v).toFixed(6)));
  }
  if (Array.isArray(pixelSpacing) && pixelSpacing.length === 2) {
    dataset.PixelSpacing = pixelSpacing.map(v => String(Number(v).toFixed(4)));
  }
  if (sliceThickness !== null && sliceThickness !== undefined) {
    dataset.SliceThickness = String(Number(sliceThickness).toFixed(3));
  }

  const meta = {
    MediaStorageSOPClassUID: SC_SOP_CLASS_UID,
    MediaStorageSOPInstanceUID: sopUid,
    TransferSyntaxUID: EXPLICIT_VR_LE,
    ImplementationClassUID: '2.25.0.0.1.4.0.0.1',
    ImplementationVersionName: 'PUTRACNS_RESEARCH_1',
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(dataset);
  const dicomDict = new DicomDict(DicomMetaDictionary.denaturalizeDataset(meta));
  dicomDict.dict = denaturalized;
  return dicomDict.write({ allowInvalidVRLength: false, fragmentMultiframe: false });
}
