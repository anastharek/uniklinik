const Users = require("../model/Users");
const jwt = require("jsonwebtoken");
const MD5 = require("crypto-js/md5");
const ActivityLog = require("../model/ActivityLog");
const ActivityType = require("../utils/ActivityType");
const {
  connected_client,
  disconnectClient,
  limitReached,
} = require("../socket/socketServer");
const {
  OTJSBadRequestException,
  OTJSUnauthorizedException,
} = require("../Exceptions/OTJSErrors");

const disconnectClientAPI = (req, res) => {
  let username = req.roles.username;
  disconnectClient(username);
  res.send(200);
};

const login = async function (req, res) {
  const body = req.body;

  if (!body.username || !body.password) {
    throw new OTJSBadRequestException("Missing Username / Password payload");
  }

  const userObject = new Users(body.username);
  let is_active = await userObject.isActive();
  if (userObject.username !== "admin" && !is_active) {
    throw new OTJSBadRequestException("Account not activated yet !!");
  }

  let check = await userObject.checkPassword(body.password);

  if (check) {
    let infosUser = await userObject.getUserRight();
    let user = await userObject._getUserEntity();
    let uploderData = null;
    if (user.uploader_of) {
      uploderData = await Users.getUserbyUsername(user.uploader_of);
    }
    let payload = {
      username: body.username,
      name: infosUser.name,
      id: user.id,
      admin: infosUser.admin,
      import: infosUser.import,
      content: infosUser.content,
      anon: infosUser.anon,
      export_local: infosUser.export_local,
      export_extern: infosUser.export_extern,
      query: infosUser.query,
      auto_query: infosUser.auto_query,
      delete: infosUser.delete,
      modify: infosUser.modify,
      cd_burner: infosUser.cd_burner,
      create_report: infosUser.create_report,
      sharing: infosUser.sharing,
      card_sharing: infosUser.card_sharing,
      autorouting: infosUser.autorouting,
      premium: infosUser.premium,
      create_patient_report: infosUser.create_patient_report,
      edit_patient_report: infosUser.edit_patient_report,
      view_patient_report: infosUser.view_patient_report,
      request_patient_report: infosUser.request_patient_report,
      delete_report: infosUser.delete_report,
      addendun: infosUser.addendun,
      can_finalize_report: infosUser.can_finalize_report,
      view_request_report: infosUser.view_request_report,
      delete_req_report: infosUser.delete_req_report,
      firstname:
        (user.firstname ? user.firstname : "") +
        " " +
        (user.lastname ? user.lastname : ""),
      uploader_of: user.uploader_of,
      uploader_of_name: uploderData
        ? `${uploderData.firstname} ${uploderData.lastname}`
        : null,
      practicing_no: user?.practicing_no,
      department: user.department,
      can_change_report_status: infosUser.can_change_report_status,
      report_with_pdf: infosUser.report_with_pdf,
      delete_imagin: infosUser.delete_imagin,
      view_imagin: infosUser.view_imagin,
      can_req_imaging: infosUser.can_req_imaging,
      can_add_radiologist_email: infosUser.can_add_radiologist_email,
      can_view_assign_caselist: infosUser.can_view_assign_caselist,
      can_view_admin_caselist: infosUser.can_view_admin_caselist,
      can_assign_doctors: infosUser.can_assign_doctors,
      can_download_zip: infosUser.can_download_zip,
      can_add_table: infosUser.can_add_table,
      share_card_download: infosUser.share_card_download,
      meddream: infosUser.meddream,
      view_and_download_light: infosUser.view_and_download_light,
      view_monitoring: infosUser.view_monitoring,
      view_system_monitoring: infosUser.view_system_monitoring,
      view_user_activity: infosUser.view_user_activity,
      view_my_dashboard: infosUser.view_my_dashboard,
      signature_compulsory: infosUser.signature_compulsory,
      moderator: infosUser.moderator,
      doctor_description_required: infosUser.doctor_description_required,
      request_scan: infosUser.request_scan,
      request_scan_calender: infosUser.request_scan_calender,
      request_scan_list: infosUser.request_scan_list,
      usg_no: infosUser.usg_no,
      can_delete_request_scan: infosUser.can_delete_request_scan,
      view_wsi: infosUser.view_wsi,
      share_card_wsi: infosUser.share_card_wsi,

      add_manufacture: infosUser.add_manufacture,
      add_vendor: infosUser.add_vendor,
      add_store_location: infosUser.add_store_location,

      view_manufacture: infosUser.view_manufacture,
      view_vendor: infosUser.view_vendor,
      view_store_location: infosUser.view_store_location,

      change_inventory_min_qty: infosUser.change_inventory_min_qty,
      change_inventory_qty: infosUser.change_inventory_qty,
      delete_record_excel: infosUser.delete_record_excel,
      save_inventory: infosUser.save_inventory,
      delete_inventory: infosUser.delete_inventory,
      use_inventory: infosUser.use_inventory,

      view_inventory: infosUser.view_inventory,
      view_maintance: infosUser.view_maintance,
      edit_inventory: infosUser.edit_inventory,

      can_assign_report_by_role: infosUser.can_assign_report_by_role,
      can_view_uploader: infosUser.can_view_uploader,
      can_create_uploader: infosUser.can_create_uploader,
      can_search_ref_physician: infosUser.can_search_ref_physician,
      can_add_logo: infosUser.can_add_logo,

      can_search_institution: infosUser.can_search_institution,
      can_register_patient: infosUser.can_register_patient,
      can_view_appointment: infosUser.can_view_appointment,
      can_view_demographic: infosUser.can_view_demographic,

      see_report_label: infosUser.see_report_label,
      edit_report_label: infosUser.edit_report_label,
      see_report_type: infosUser.see_report_type,
      edit_report_type: infosUser.edit_report_type,
      limit: infosUser.limit,
      view_registered_user: infosUser.view_registered_user,

      main_table_checkbox: infosUser.main_table_checkbox,
      main_table_status: infosUser.main_table_status,
      main_table_detail: infosUser.main_table_detail,
      main_table_date: infosUser.main_table_date,
      main_table_time: infosUser.main_table_time,
      main_table_patient_name: infosUser.main_table_patient_name,
      main_table_patient_id: infosUser.main_table_patient_id,
      main_table_accession: infosUser.main_table_accession,
      main_table_description: infosUser.main_table_description,
      main_table_gender: infosUser.main_table_gender,
      main_table_dob: infosUser.main_table_dob,
      main_table_age: infosUser.main_table_age,
      main_table_selectBtn: infosUser.main_table_selectBtn,
      main_table_viewBtn: infosUser.main_table_viewBtn,
      main_table_reportBtn: infosUser.main_table_reportBtn,

      can_request_feature: infosUser.can_request_feature,
      can_view_request_feature: infosUser.can_view_request_feature,
      main_table_patient_select: infosUser.main_table_patient_select,
      delete_request_feature: infosUser.delete_request_feature,
      can_transfer: infosUser.can_transfer,
      generate_series: infosUser.generate_series,
      create_dataset: infosUser.create_dataset,
      dataset_request: infosUser.dataset_request,

      download_dataset_excel: infosUser.download_dataset_excel,
      view_dataset: infosUser.view_dataset,
      view_my_dataset: infosUser.view_my_dataset,
      copy_osimis: infosUser.copy_osimis,
      copy_stone: infosUser.copy_stone,
      copy_download_zip: infosUser.copy_download_zip,
      main_table_modality_view: infosUser.main_table_modality_view,
      delete_dataset: infosUser.delete_dataset,

      manage_report_template: infosUser.manage_report_template,
      send_report_dicom: infosUser.send_report_dicom,
      manage_auto_send_ai: infosUser.manage_auto_send_ai,
      patient_management: infosUser.patient_management,
      view_radiant: infosUser.view_radiant,
      view_horos: infosUser.view_horos,
      view_weasis: infosUser.view_weasis,
      view_osimis: infosUser.view_osimis,
      view_aiViewer: infosUser.view_aiViewer,
      download_report: infosUser.download_report,
      print_report: infosUser.print_report,
      view_padiLabel: infosUser.view_padiLabel
    };
    // Object.keys(payload).forEach((key) => {
    //   if (!payload[key]) {
    //     delete payload[key];
    //   }
    // });
    if (process.env.NODE_ENV != "test") {
      var TOKEN = jwt.sign(
        {
          id: user.id,
          username: body.username,
          name: infosUser.name,
          firstname:
            (user.firstname ? user.firstname : "") +
            " " +
            (user.lastname ? user.lastname : ""),
          uploader_of: user.uploader_of,
          uploader_of_name: uploderData
            ? `${uploderData.firstname} ${uploderData.lastname}`
            : null,
          practicing_no: user?.practicing_no,
          department: user.department,
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: "5h",
        }
      ); //tukar
      res.cookie("tokenOrthancJs", TOKEN, { httpOnly: true });
    }
    if (limitReached(body.username)) {
      payload.already = true;
    }
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    req.ip = clientIp;
    ActivityLog.create(ActivityType.LOGIN, "login", payload.username, req.ip);
    res.json(payload);
  } else {
    throw new OTJSUnauthorizedException("Wrong Credentials");
  }
};

const loginExternal = function (req, res) {
  const { password } = req.body;
  const { studyInstanceId } = req.params;

  const IDs = studyInstanceId.split(".");
  const slicedPwd = MD5(IDs.pop()).toString();
  const PWD = slicedPwd.slice(slicedPwd.length - 8);

  if (PWD === password) {
    res.cookie("external", studyInstanceId, { httpOnly: true });
    return res.sendStatus(200);
  }
  res.sendStatus(401);
};

const logOut = function (req, res) {
  //Invalid the frontend cookie
  ActivityLog.create(
    ActivityType.LOGOUT,
    "manual logout",
    req.username,
    req.ip
  );
  if (process.env.NODE_ENV != "test") {
    res.cookie("tokenOrthancJs", "", { httpOnly: true });
  }
  // let index = connected_client.findIndex(req.roles.username);
  // if (index != -1) {
  //   connected_client.splice(index, 1);
  // }
  res.sendStatus(200);
};

module.exports = { login, loginExternal, logOut, disconnectClientAPI };
