const jwt = require("jsonwebtoken");
const { OTJSForbiddenException } = require("../Exceptions/OTJSErrors");
const Task = require("../model/Task");
const Users = require("../model/Users");
const RegisteredPatient = require("../model/RegisteredPatient");
const Roles = require("../model/Roles");
const userAuthMidelware =async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    try {
      let token =req.cookies.tokenOrthancJs||req.headers.systemtoken;
      let payload = jwt.verify(token, process.env.TOKEN_SECRET);
      if(payload.patient_id){
         patient = await RegisteredPatient.getPatientById(payload.id);
         req.roles = await Roles.getPermission(patient.role);
         req.username = payload.patient_id;
         req.user = {id:payload.id};
         req.is_patient = true;
      }else{
      const userObject = new Users(payload.username);
      req.roles = await userObject.getUserRight();
      req.username = payload.username;
      req.roles.username = payload.username;
      req.user={id:payload.id};
      }
      next();
    } catch (err) {
      console.log('err=>',err);
      res.sendStatus(401);
      return;
    }
  }
};

const userOrExternalAuthMiddleware = async(req, res, next) => {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    // A valid session JWT always takes priority: a logged-in user who also
    // carries a (possibly stale) `external` cookie from a shared link must be
    // treated as a normal logged-in user, not restricted to the cookie's study.
    // (Otherwise opening a shared link and later viewing another study breaks
    // capture uploads / NIfTI conversion for that session.)
    const token = req.cookies.tokenOrthancJs;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.TOKEN_SECRET);
        const userObject = new Users(payload.username);
        req.roles = await userObject.getUserRight();
        return next();
      } catch (err) {
        // invalid/expired JWT → fall through to the external-cookie check
      }
    }
    let studyInstanceId = req.cookies.external;
    if (studyInstanceId && req.originalUrl.includes(studyInstanceId)) {
      next();
    } else {
      res.sendStatus(403);
      return;
    }
  }
};

const isCurrentUserOrAdminMidelWare = function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.admin || req.roles.username === req.params.username) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const userAdminMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.admin) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const importMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.import) {
    next();
  } else {
    res.sendStatus(403);
  }
};

/**
 * Minimal DICOM explicit-VR-little-endian parser — extracts one top-level
 * tag value (used to read StudyInstanceUID / SOPClassUID from the raw
 * application/dicom upload body without pulling in a DICOM library).
 */
function extractDicomTag(buf, tagGroup, tagElement) {
  if (!Buffer.isBuffer(buf) || buf.length < 132) return null;
  if (buf.toString('latin1', 128, 132) !== 'DICM') return null;
  let off = 132;
  const end = buf.length;
  const LONG_VR = ['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'];
  while (off + 8 <= end) {
    const group = buf.readUInt16LE(off);
    const element = buf.readUInt16LE(off + 2);
    const vr = buf.toString('latin1', off + 4, off + 6);
    let len, valueOff;
    if (LONG_VR.includes(vr)) {
      if (off + 12 > end) return null;
      len = buf.readUInt32LE(off + 8);
      valueOff = off + 12;
    } else {
      if (off + 8 > end) return null;
      len = buf.readUInt16LE(off + 6);
      valueOff = off + 8;
    }
    if (group === tagGroup && element === tagElement) {
      return buf
        .toString('latin1', valueOff, valueOff + len)
        .replace(/\0+$/, '');
    }
    off = valueOff + len;
    if (len % 2 === 1) off += 1; // even-length padding
  }
  return null;
}

/**
 * Scope guard for POST /api/instances (Capture Image upload).
 *  - Logged-in user (req.roles set): keep the import-role requirement.
 *  - External/shared-link access (only the `external` cookie, no JWT): allow
 *    ONLY when the uploaded DICOM is a Secondary Capture whose
 *    StudyInstanceUID equals the external cookie's study — so a shared-link
 *    viewer can save captures into the study they already have access to, and
 *    nothing else.
 */
const captureScopeMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    return next();
  }
  if (req.roles) {
    if (req.roles.import) return next();
    return res.sendStatus(403);
  }
  try {
    const studyUid = extractDicomTag(req.body, 0x0020, 0x000d); // StudyInstanceUID
    const sopClass = extractDicomTag(req.body, 0x0008, 0x0016); // SOPClassUID
    const externalStudy = req.cookies.external;
    const isSC = sopClass === '1.2.840.10008.5.1.4.1.1.7'; // Secondary Capture
    if (!externalStudy || studyUid !== externalStudy || !isSC) {
      return res.sendStatus(403);
    }
    return next();
  } catch (e) {
    return res.sendStatus(403);
  }
};

const contentMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.content || req.is_patient) {
    if (req.is_patient){
      req.body.Query.PatientID = req.username;
    }
    next();
  } else {
    res.sendStatus(403);
  }
};

const anonMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.anon) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const exportLocalMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.export_local) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const exportExternMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.export_extern) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const queryMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.query) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const autoQueryMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.auto_query) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const deleteMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.delete) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const modifyMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.modify) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const cdBurnerMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.cd_burner) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const autoroutingMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else if (req.roles.autorouting) {
    next();
  } else {
    res.sendStatus(403);
  }
};

const ownTaskOrIsAdminMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV == "test") {
    next();
  } else {
    let task = await Task.getTask(req.params.id);
    if (task.creator !== req.roles.username && !req.roles.admin)
      throw new OTJSForbiddenException("Task not owned");
    next();
  }
};

const roleAccessLabelMidelware = async function (req, res, next) {
  if (process.env.NODE_ENV === "test") {
    next();
  } else {
    const RoleLabel = require("../model/RoleLabel");
    const role_label = await RoleLabel.getLabelsFromRoleName(req.roles.name);
    let access = false;

    for (var i = 0; i < role_label.length; i++) {
      if (req.params.name === role_label[i].label_name) {
        access = true;
        break;
      }
    }

    if (access) {
      next();
    } else {
      userAdminMidelware(req, res, next);
    }
  }
};

/**
 * External/shared-link gate for the research (NIfTI) endpoints.
 * Logged-in users pass through untouched; external users (only the `external`
 * cookie, no JWT) are allowed only when the requested study is the one in
 * their cookie — mirror of captureScopeMidelware, but for JSON bodies.
 *
 * Order matters: run this BEFORE userAuthMidelware. When an external cookie
 * is present we skip the JWT requirement entirely (route handlers below
 * enforce the study-scope check), otherwise userAuthMidelware applies.
 */
const researchScopeMidelware = async function (req, res, next) {
  // A valid session JWT always takes priority (same rule as
  // userOrExternalAuthMiddleware): a logged-in user who also carries a stale
  // `external` cookie must NOT be restricted to the cookie's study.
  const token = req.cookies && (req.cookies.tokenOrthancJs || req.headers.systemtoken);
  if (token) {
    try {
      jwt.verify(token, process.env.TOKEN_SECRET);
      return next(); // valid JWT → normal logged-in flow (userAuthMidelware)
    } catch (err) {
      // invalid/expired JWT → keep external handling
    }
  }
  const external = req.cookies && req.cookies.external;
  if (!external) {
    return next(); // no external cookie — fall through to the JWT gate
  }
  req.isExternal = true;
  req.externalStudyUid = external;
  return next();
};

/**
 * Strip patient-level tags that Orthanc would otherwise refuse to override
 * when creating a DICOM instance under an existing parent (study/patient).
 * The frontend maps the "NRIC" field to OtherPatientIDs; when a Parent is
 * supplied, Orthanc inherits patient-level tags from that parent and throws
 * HTTP 400 ("Trying to override a value inherited from a parent module").
 */
const stripCreateDicomInheritedTags = function (req, res, next) {
  if (
    req.body &&
    req.body.Parent &&
    req.body.Tags &&
    typeof req.body.Tags === "object"
  ) {
    delete req.body.Tags.OtherPatientIDs;
    delete req.body.Tags.PatientID;
    delete req.body.Tags.PatientName;
  }
  next();
};

module.exports = {
  captureScopeMidelware,
  researchScopeMidelware,
  userAuthMidelware,
  userAdminMidelware,
  importMidelware,
  contentMidelware,
  anonMidelware,
  exportLocalMidelware,
  exportExternMidelware,
  queryMidelware,
  autoQueryMidelware,
  deleteMidelware,
  modifyMidelware,
  cdBurnerMidelware,
  isCurrentUserOrAdminMidelWare,
  ownTaskOrIsAdminMidelware,
  roleAccessLabelMidelware,
  autoroutingMidelware,
  userOrExternalAuthMiddleware,
  stripCreateDicomInheritedTags,
};
