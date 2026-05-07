var express = require("express");
var router = express.Router();
// Handle controller errors
const ReverseProxy = require("../model/ReverseProxy");
require("express-async-errors");

const {
  getParsedAnswer,
  postRetrieve,
} = require("../controllers/queryRetrieve");
const {
  reverseProxyGet,
  reverseProxyPost,
  reverseProxyPostUploadDicom,
  reverseProxyDelete,
} = require("../controllers/reverseProxy");
const {
  startBurner,
  getBurner,
  stopBurner,
  cancelJobBurner,
  startAutorouter,
  stopAutorouter,
  getAutorouter,
} = require("../controllers/monitoring");

const {
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
  userAuthMidelware,
  userAdminMidelware,
  ownTaskOrIsAdminMidelware,
  autoroutingMidelware,
  userOrExternalAuthMiddleware,
} = require("../midelwares/authentication");
const ActivityType = require("../utils/ActivityType");
const { log_activity } = require("../midelwares/activity_logger");
const {
  checkForOrthancQueueReady,
  getTask,
  getTasks,
  getTasksIds,
  getTaskWithUser,
  getTasksOfType,
  deleteTask,
  deleteTaskOfUser,
  addAnonTask,
  addDeleteTask,
  addRetrieveTask,
  deleteRetrieveItem,
  addExportTask,
  retryRetrieveItem,
} = require("../controllers/task");

const { allEndpoints } = require("../controllers/endpoints");
const { getExportTranscoding } = require("../controllers/options");

//added by rishbh
const {
  getAdminReport,
  getPatientReport,
  createDraftReport,
  createFinalReport,
  DeleteReport,
  isreportFinalize,
  getDoctorsReport,
  getAllDoctorsReport,
  deleteDoctorReport,
  deleteDoctorbyName,
  searchData,
  searchDataPagination,
  searchDataDoctor,
  searchPatientReport,
  updateDoctor,
  assignDoctor,
  assigByRoles,
  checkFinalizeByIDs,
  getPreviosReport,
  syncSingleStudy,
  syncBulkStudy,
  updateLabels,
  generateAiSeries,
  aiseriesCreated,
} = require("../controllers/patientReport");

const {
  getAllRequestReport,
  getRequestReport,
  createRequestReport,
  updateStatus,
  deleteRequestReport,
} = require("../controllers/requestReport");

const RequestScanController = require("../controllers/RequestScan");
const ActivityLogController = require("../controllers/activitylog");
const advanceImagin = require("../controllers/advanceImagin");
const SystemUsageController = require("../controllers/system-usage");
const PacAdmin = require("../controllers/pac-admin");
const InventoryController=require("../controllers/inventory");
const RolesController=require('../controllers/role');
const UploaderController=require('../controllers/uploader');
const Demographic=require('../controllers/demographic');
const RequestFeature=require('../controllers/request-feature');
const Cryotography=require('../controllers/crypto.Controller');
const AiSeriesConf=require('../controllers/aiSeriesConf');
const AccessionFiller=require('../controllers/accession-filler');
const datasetController=require('../controllers/dataset.Controller');
const AiAutorouter=require('../controllers/AiAutorouter');
const ReportTemplate=require('../controllers/ReportTemplate');
const PatientController=require('../controllers/patientController');
const PadilabelController=require('../controllers/PadilabelController');
router.get("/modalities", userAuthMidelware, reverseProxyGet);
router.post(
  "/modalities/*/store",
  [userAuthMidelware, exportLocalMidelware],
  reverseProxyPost
);

// Orthanc Query / Retrieve Routes
router.post(
  "/modalities/:modality/query",
  [userAuthMidelware, queryMidelware],
  reverseProxyPost
);
router.get(
  "/queries/:orthancIdQuery/answers*",
  [userAuthMidelware, queryMidelware],
  reverseProxyGet
);
router.post("/retrieve", [userAuthMidelware, queryMidelware], postRetrieve);

//PadiMedical API to get simplified results from Orthanc
router.get(
  "/queries/:orthancIdQuery/parsedAnswers",
  [userAuthMidelware, queryMidelware],
  getParsedAnswer
);

// Orthanc Dicom Import Route
router.post(
  "/instances",
  [userAuthMidelware, importMidelware],
  reverseProxyPostUploadDicom
);

//Orthanc export routes
router.post(
  "/tools/create-archive",
  [userAuthMidelware, exportLocalMidelware],
  reverseProxyPost
);
router.post(
  "/tools/create-media-extended",
  [userAuthMidelware, exportLocalMidelware],
  reverseProxyPost
);

//Orthanc Create Dicom Route
router.post(
  "/tools/create-dicom",
  [userAuthMidelware, importMidelware],
  reverseProxyPost
);

//Orthanc Peers Routes
router.get(
  "/peers*",
  [userAuthMidelware, exportExternMidelware],
  reverseProxyGet
);
router.post(
  "/peers/*/store",
  [userAuthMidelware, exportExternMidelware],
  reverseProxyPost
);

//Jobs to monitor orthanc
router.get("/jobs*", [userAuthMidelware], reverseProxyGet);

//Orthanc Modify
router.post(
  "/patients/*/modify",
  [userAuthMidelware, modifyMidelware],
  reverseProxyPost
);
router.post(
  "/studies/*/modify",
  [userAuthMidelware, modifyMidelware],
  reverseProxyPost
);
router.post(
  "/series/*/modify",
  [userAuthMidelware, modifyMidelware],
  reverseProxyPost
);

//Tools Find API for Orthanc Content Role
router.post(
  "/tools/find",
  [
    userAuthMidelware,
    contentMidelware,
    (req, res, next) => {
      log_activity(req, res, next, ActivityType.SEARCH_STUDY);
    },
  ],
  reverseProxyPost
);

//Reverse Proxy Routes for orthanc content => Warning non RBAC Protected
//SK A VERIFIER QUE LES RACINES SONT BIEN VEROUILLEES
router.get("/patients/*", [userAuthMidelware], reverseProxyGet);
router.get("/studies/*", [userAuthMidelware], reverseProxyGet);

// Series thumbnail preview - finds one instance and returns Orthanc preview JPEG
router.get("/series/:uid/thumbnail", [userAuthMidelware], async (req, res) => {
  try {
    const seriesUid = req.params.uid;
    const findResult = await ReverseProxy.getAnswer('/tools/find', 'POST', {
      Level: 'Instance',
      Query: { SeriesInstanceUID: seriesUid },
      Limit: 1
    });
    if (!findResult || findResult.length === 0) {
      return res.status(404).send('No instances found');
    }
    const instanceUuid = findResult[0];
    await ReverseProxy.streamToRes(`/instances/${instanceUuid}/preview`, 'GET', undefined, res);
  } catch (err) {
    if (!res.headersSent) res.status(502).send('Preview unavailable');
  }
});

router.get("/series/*", [userAuthMidelware], reverseProxyGet);
router.get("/instances/*", [userAuthMidelware], reverseProxyGet);
router.get("/dicom-web/*", [userOrExternalAuthMiddleware], reverseProxyGet);
// PadiMedical: Exact /wado route (no redirect) for WADO-URI image rendering
router.get("/wado", [userAuthMidelware], reverseProxyGet);
router.get("/wado/*", [userAuthMidelware], reverseProxyGet);

//Delete Orthanc ressource API
router.delete(
  "/patients/*",
  [userAuthMidelware, deleteMidelware],
  reverseProxyDelete
);
router.delete(
  "/studies/*",
  [
    userAuthMidelware,
    deleteMidelware,
    (req, res, next) => log_activity(req, res, next, ActivityType.DELETE_STUDY),
  ],
  reverseProxyDelete
);
router.delete(
  "/series/*",
  [userAuthMidelware, deleteMidelware],
  reverseProxyDelete
);

//Monitoring
//cdBurner
router.post(
  "/monitoring/burner",
  [userAuthMidelware, cdBurnerMidelware],
  startBurner
);
router.delete(
  "/monitoring/burner",
  [userAuthMidelware, cdBurnerMidelware],
  stopBurner
);
router.get(
  "/monitoring/burner",
  [userAuthMidelware, cdBurnerMidelware],
  getBurner
);
router.post(
  "/monitoring/burner/jobs/:jobBurnerId/cancel",
  [userAuthMidelware, cdBurnerMidelware],
  cancelJobBurner
);
//Autorouter
router.get(
  "/monitoring/autorouter",
  [userAuthMidelware, autoroutingMidelware],
  getAutorouter
);
router.post(
  "/monitoring/autorouter",
  [userAuthMidelware, autoroutingMidelware],
  startAutorouter
);
router.delete(
  "/monitoring/autorouter",
  [userAuthMidelware, autoroutingMidelware],
  stopAutorouter
);

//Server Time
router.get("/tools/time", userAuthMidelware, (req, res) => {
  res.send(new Date().toLocaleString());
});

//Endpoints and transcoding option
router.get("/endpoints/", [userAuthMidelware], allEndpoints);
router.get(
  "/options/export-transcoding",
  [userAuthMidelware],
  getExportTranscoding
);

/*
 ** TASKS
 */

router.use("/tasks", checkForOrthancQueueReady);

//PadiMedical Robot routes
//Retrieve Robot
router.post(
  "/tasks/:username/retrieve",
  [userAuthMidelware, autoQueryMidelware],
  addRetrieveTask
);

//AnonRobot
router.post(
  "/tasks/:username/anonymize",
  [userAuthMidelware, anonMidelware],
  addAnonTask
);

//DeleteRobot
//SK BUG MIDELWARE DELETE?
router.post(
  "/tasks/:username/delete",
  [userAuthMidelware, isCurrentUserOrAdminMidelWare],
  addDeleteTask
);

//FTP & WebDav Exports
router.post(
  "/tasks/:user/export",
  [userAuthMidelware, exportExternMidelware],
  addExportTask
);

//Tasks
//SK : ICI MANQUE LES MIDDELWARE
router.get("/tasks/:username/:type", userAuthMidelware, getTaskWithUser);
//SK ICI FAUT MUTIPLIER CETTE ROUTE POUR CHAQUE TYPE POUR ASSOCIER LE BON MIDDELWARE
router.delete(
  "/tasks/:username/:type",
  [userAuthMidelware, isCurrentUserOrAdminMidelWare],
  deleteTaskOfUser
);
router.delete(
  "/tasks/retrieve/:taskId/:itemId",
  [userAuthMidelware, isCurrentUserOrAdminMidelWare, autoQueryMidelware],
  deleteRetrieveItem
);
router.put(
  "/tasks/retrieve/:taskId/:itemId/retry",
  [userAuthMidelware, isCurrentUserOrAdminMidelWare, autoQueryMidelware],
  retryRetrieveItem
);
router.get(
  "/tasks/:id",
  [userAuthMidelware, ownTaskOrIsAdminMidelware],
  getTask
);
router.delete(
  "/tasks/:id",
  [userAuthMidelware, ownTaskOrIsAdminMidelware],
  deleteTask
);
router.get("/tasks", [userAuthMidelware, userAdminMidelware], getTasksIds);
router.get("/tasks?expend", [userAuthMidelware, userAdminMidelware], getTasks);

//patient report
router.post("/report/sync/single", userAuthMidelware, syncSingleStudy);
router.post("/report/ai-series", userAuthMidelware, generateAiSeries);
router.get("/report/ai-series/done/:studyid/:seriesid", userAuthMidelware, aiseriesCreated);
router.post("/report/sync/bulk", userAuthMidelware, syncBulkStudy);
router.post("/admin-report", userAuthMidelware, getAdminReport);
router.post("/patient-report", userAuthMidelware, getPatientReport);
router.post("/create-report-final", userAuthMidelware, createFinalReport);
router.post("/create-report-draft", userAuthMidelware, createDraftReport);
router.delete("/admin-report", userAuthMidelware, DeleteReport);
router.post("/report-status-by-ids", userAuthMidelware, checkFinalizeByIDs);
router.get("/get-previos-report/:patient_id",userAuthMidelware,getPreviosReport)

//request report
router.get("/request-report/get-all", userAuthMidelware, getAllRequestReport);
router.get(
  "/request-report/:studyid/is_finalize",
  userAuthMidelware,
  isreportFinalize
);
router.get("/request-report/:studyid", userAuthMidelware, getRequestReport);
router.post("/request-report", userAuthMidelware, createRequestReport);
router.put("/request-report", userAuthMidelware, updateStatus);
router.delete("/request-report", userAuthMidelware, deleteRequestReport);

//advance imagin
router.get("/request-imagin/:id", userAuthMidelware, advanceImagin.get);
router.get("/request-imagin", userAuthMidelware, advanceImagin.getAll);
router.post("/request-imagin", userAuthMidelware, advanceImagin.createImagin);
router.delete(
  "/request-imagin/:id",
  userAuthMidelware,
  advanceImagin.deleteImagin
);

//doctors case list
router.get("/doctor-case-list", userAuthMidelware, getDoctorsReport);
router.get("/all-doctor-case-list", userAuthMidelware, getAllDoctorsReport);
router.delete("/doctor-case-list", userAuthMidelware, deleteDoctorReport);
router.delete("/remove-assign-doctor", userAuthMidelware, deleteDoctorbyName);
router.post(
  "/seach-reports",
  [
    userAuthMidelware,
    (req, res, next) => {
      log_activity(req, res, next, ActivityType.SEARCH_ALLCASELIST);
    },
  ],
  searchData
);
router.post(
  "/doctor/seach-reports",
  [
    userAuthMidelware,
    (req, res, next) => {
      log_activity(req, res, next, ActivityType.SEARCH_MYCASELIST);
    },
  ],
  searchDataDoctor
);
router.post(
  "/patient/seach-reports",
  [
    userAuthMidelware,
    (req, res, next) => {
      log_activity(req, res, next, ActivityType.SEARCH_PATIENT_REPORT);
    },
  ],
  searchPatientReport
);
router.post("/update-report-doctors", userAuthMidelware, updateDoctor);
router.post("/update-report-labels", userAuthMidelware, updateLabels);
router.post("/assign-doctor/report", userAuthMidelware, assignDoctor);
router.post("/assign-roles/report", userAuthMidelware, assigByRoles);

//activity log
router.get("/activity", userAuthMidelware, ActivityLogController.getActivity);
router.get(
  "/activity/user",
  userAuthMidelware,
  ActivityLogController.getActivityUser
);
router.post(
  "/activity",
  userAuthMidelware,
  ActivityLogController.createActivity
),
  //system usage
  router.get("/system-usage", userAuthMidelware, SystemUsageController.get);

//pac admin
router.get("/pac-admin", userAuthMidelware, PacAdmin.get_pacadmin);
router.post("/pac-admin", userAuthMidelware, PacAdmin.create_pacadmin);

//request scan
router.get(
  "/request-scan",
  userAuthMidelware,
  RequestScanController.get_reports
);
router.post(
  "/request-scan",
  userAuthMidelware,
  RequestScanController.create_request_scan
);

router.delete('/request-scan',userAuthMidelware,RequestScanController.delete_report)


//inventory routes start



router.post('/inventory/create-item',userAuthMidelware,InventoryController.create_inventory)
router.post('/inventory/create-item-bulk',userAuthMidelware,InventoryController.create_inventory_bulk)
router.post('/inventory/create-location',userAuthMidelware,InventoryController.create_location)
router.post('/inventory/create-vendor',userAuthMidelware,InventoryController.create_vendor)
router.post('/inventory/create-manufacture',userAuthMidelware,InventoryController.create_manufacture)
router.post('/inventory/create-category',userAuthMidelware,InventoryController.create_category)
router.post('/inventory/use-inventory-item',userAuthMidelware,InventoryController.use_inventory)

router.get('/inventory/activity',userAuthMidelware,InventoryController.get_inventory_activity)
router.get('/inventory/summary',userAuthMidelware,InventoryController.inventroy_summary)
router.get('/inventory/related-data',userAuthMidelware,InventoryController.get_item_releted_data)
router.get('/inventory/items',userAuthMidelware,InventoryController.get_inventory)
router.get('/inventory/items-distinct',userAuthMidelware,InventoryController.get_inventory_distinct)
router.get('/inventory/categorys',userAuthMidelware,InventoryController.get_category)
router.get('/inventory/manufactures',userAuthMidelware,InventoryController.get_manufacture)
router.get('/inventory/vendors',userAuthMidelware,InventoryController.get_vendor)
router.get('/inventory/locations',userAuthMidelware,InventoryController.get_location)
router.get('/inventory/used-inventory',userAuthMidelware,InventoryController.get_used_inventory)

router.put('/inventory/item',userAuthMidelware,InventoryController.update_inventory)
router.put('/inventory/category',userAuthMidelware,InventoryController.update_category)
router.put('/inventory/manufacture',userAuthMidelware,InventoryController.update_manufacture)
router.put('/inventory/vendor',userAuthMidelware,InventoryController.update_vendor)
router.put('/inventory/location',userAuthMidelware,InventoryController.update_location)

router.delete('/inventory/item/:id',userAuthMidelware,InventoryController.delete_inventory)
router.delete('/inventory/category/:id',userAuthMidelware,InventoryController.delete_category)
router.delete('/inventory/manufacture/:id',userAuthMidelware,InventoryController.delete_manufacture)
router.delete('/inventory/vendor/:id',userAuthMidelware,InventoryController.delete_vendor)
router.delete('/inventory/used-inventory/:id',userAuthMidelware,InventoryController.delete_inventory_activity)

router.get("/roles-name/all",userAuthMidelware,RolesController.getAllRolesName)

router.get('/uploader',userAuthMidelware,UploaderController.getMyUploader)
router.post('/uploader',userAuthMidelware,UploaderController.setMyUploader)

//inventory routes end

//***********Demographic Start************************ */
router.post('/demographic/register',Demographic.register);
router.get('/demographic/patient/:id',Demographic.getPatient);
router.get('/demographic/patient/suggest/:name',Demographic.getPatientByName);
router.get('/demographic/appointment',Demographic.getAppointment);
router.put('/demographic/appointment/:id',Demographic.updataAppointment);
//***********Demographic End************************** */

//******************RequestFeature Start*******************/
router.get('/request-feature/:id',userAuthMidelware,RequestFeature.getRequestFeature)
router.get('/request-feature',userAuthMidelware,RequestFeature.getRequestFeatureList)
router.post('/request-feature',userAuthMidelware,RequestFeature.CreateRequestFeature)
router.delete('/request-feature/:id',userAuthMidelware,RequestFeature.deleteRequestFeature)
//******************RequestFeature End*********************/

//****************** Cryotography Start*********************/
router.post('/crypto/encrypt',Cryotography.generateKey)
router.post('/crypto/decrypt',Cryotography.decryptKey)
//****************** Cryotography End*********************/

//****************** AI Series Conf Start*********************/
router.get('/ai-series-conf',userAuthMidelware,AiSeriesConf.getConf)
router.post('/ai-series-conf',userAuthMidelware,AiSeriesConf.saveConf)
router.put('/ai-series-conf',userAuthMidelware,AiSeriesConf.updateConf)
router.delete('/ai-series-conf',userAuthMidelware,AiSeriesConf.deleteConf)
//****************** AI Series Conf End*********************/

//****************** Accession Filler Start*********************/
router.get('/accession-filler',AccessionFiller.Accessionfiller)
//****************** Accession Filler End*********************/

//****************** Dataverse Start*********************/
router.get('/dataverse',datasetController.GetDataSet)
router.get('/dataverse/my-dataset',userAuthMidelware,datasetController.GetDatasetByOwner)
router.post('/dataverse',userAuthMidelware,datasetController.CreateDataset)
router.put('/dataverse',userAuthMidelware,datasetController.UpdateDataset)
router.get('/dataverse/subscribe',userAuthMidelware,datasetController.GetSubscribedDatasets)
router.post('/dataverse/subscribe',userAuthMidelware,datasetController.SubscriptToDataset)
router.delete('/dataverse/subscribe',userAuthMidelware,datasetController.UnsubscribeFromDataset)
router.get('/dataverse/request',userAuthMidelware,datasetController.GetDatasetRequestsUser)
router.get('/dataverse/request-admin',userAuthMidelware,userAdminMidelware,datasetController.GetDatasetRequestAdmin)
router.post('/dataverse/request',userAuthMidelware,datasetController.RequestForDataset)
router.post('/dataverse/accept-request',userAuthMidelware,userAdminMidelware,datasetController.AcceptDatasetRequest)
router.post('/dataverse/reject-request',userAuthMidelware,userAdminMidelware,datasetController.RejectDatasetRequest)
router.post('/dataverse/analytics',userAuthMidelware,userAdminMidelware,datasetController.getDatasetAnalytics)
router.get('/dataverse/users',userAuthMidelware,datasetController.getDatasetUsers)
router.get('/dataverse/:id',userAuthMidelware,datasetController.GetDatasetById)
router.get('/dataverse-public/:id',datasetController.GetDatasetById)
router.post('/dataverse/assign',userAuthMidelware,datasetController.assignDataset)
router.post('/dataverse/unassign',userAuthMidelware,datasetController.unassignDataset)
router.delete('/dataverse/:dataset_id',userAuthMidelware,datasetController.deleteDataset)
//****************** Dataverse End*********************/

//****************** AiAutorouter Start*********************/
router.get("/ai-autorouter", userAuthMidelware, AiAutorouter.getAiAutorouter);
router.post("/ai-autorouter", userAuthMidelware, AiAutorouter.createAiAutorouter);
router.put("/ai-autorouter/:id", userAuthMidelware, AiAutorouter.updateAiAutorouter);
router.delete("/ai-autorouter/:id", userAuthMidelware, AiAutorouter.deleteAiAutorouter);
//****************** AiAutorouter End*********************/

//****************** ReportTemplate Start*********************/
router.get("/report-template", userAuthMidelware,ReportTemplate.getAll );
router.post("/report-template", userAuthMidelware,ReportTemplate.create );
router.get("/report-template/:id", userAuthMidelware,ReportTemplate.getID );
router.put("/report-template/:id", userAuthMidelware,ReportTemplate.update );
router.delete("/report-template/:id", userAuthMidelware,ReportTemplate.remove );
//****************** ReportTemplate End*********************/


//****************** Patient Routes  *********************/
router.post('/patient', userAuthMidelware, PatientController.createPatient);
router.get('/patient', userAuthMidelware, PatientController.getAllPatients);
router.get('/patient/:id', userAuthMidelware, PatientController.getPatientById);
router.put('/patient/:id', userAuthMidelware, PatientController.updatePatient);
router.delete('/patient/:id', userAuthMidelware, PatientController.deletePatient);
//****************** Patient Routes End *********************/


//****************** Padilabel Routes  *********************/
router.post('/padilabel', userAuthMidelware, PadilabelController.createPadilabel);
router.get('/padilabel', userAuthMidelware, PadilabelController.getAllPadilabels);
router.get('/padilabel/:id', userAuthMidelware, PadilabelController.getPadilabelById);
router.put('/padilabel/:id', userAuthMidelware, PadilabelController.updatePadilabel);
router.delete('/padilabel/:id', userAuthMidelware, PadilabelController.deletePadilabel);
//****************** Padilabel Routes End *********************/

module.exports = router;
