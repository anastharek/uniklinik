const db = require("../database/models");
const { OTJSDBEntityNotFoundException } = require("../Exceptions/OTJSErrors");

class Role{
  static async getRole(name) {
    let data = await db.Role.findOne({
      where: { name: name },
    });
    return data;
  }

  static async getAllRoleName(){
    return db.Role.findAll({attributes: ['name']})
  }
  static async getAllRole() {
    return db.Role.findAll().catch((error) => {
      throw error;
    });
  }

  static async create(
    name,
    importR,
    content,
    anon,
    exportLocal,
    exportExtern,
    query,
    autoQuery,
    deleteR,
    modify,
    cd_burner,
    create_report,
    sharing,
    card_sharing,
    autorouting,
    admin,
    premium,
    create_patient_report,
    edit_patient_report,
    view_patient_report,
    request_patient_report,
    delete_report,
    addendun,
    can_finalize_report,
    view_request_report,
    delete_req_report,
    can_change_report_status,
    report_with_pdf,
    view_imagin,
    delete_imagin,
    can_req_imaging,
    can_add_radiologist_email,
    can_view_assign_caselist,
    can_view_admin_caselist,
    can_assign_doctors,
    can_download_zip,
    can_add_table,
    share_card_download,
    meddream,
    view_and_download_light,
    view_monitoring,
    view_system_monitoring,
    view_user_activity,
    view_my_dashboard,
    signature_compulsory,
    moderator,
    doctor_description_required,
    request_scan,
    request_scan_calender,
    request_scan_list,
    usg_no,
    can_delete_request_scan,
    view_wsi,
    share_card_wsi,
    add_manufacture,
    add_vendor,
    add_store_location,
    view_manufacture,
    view_vendor,
    view_store_location,
    change_inventory_min_qty,
    change_inventory_qty,
    delete_record_excel,
    save_inventory,
    delete_inventory,
    use_inventory,
    view_inventory,
    view_maintance,
    edit_inventory,
    can_assign_report_by_role,
    can_view_uploader,
    can_create_uploader,
    can_search_ref_physician,
    can_add_logo,
    can_search_institution,
    can_register_patient,
    can_view_appointment,
    can_view_demographic,
    see_report_label,
    edit_report_label,
    see_report_type,
    edit_report_type,
    limit,
    view_registered_user,

    main_table_checkbox,
    main_table_status,
    main_table_detail,
    main_table_date,
    main_table_time,
    main_table_patient_name,
    main_table_patient_id,
    main_table_accession,
    main_table_description,
    main_table_gender,
    main_table_dob,
    main_table_age,
    main_table_selectBtn,
    main_table_viewBtn,
    main_table_reportBtn,
    can_request_feature,
    can_view_request_feature,
    main_table_patient_select,
    delete_request_feature,
    can_transfer,
    generate_series,

    create_dataset,
    dataset_request,

    download_dataset_excel,
    view_dataset,
    view_my_dataset,
    copy_osimis,
    copy_stone,
    copy_download_zip,
    main_table_modality_view,
    delete_dataset,
    manage_report_template,
    send_report_dicom,
    manage_auto_send_ai,
    patient_management,
    view_radiant,
    view_horos,
    view_weasis,
      preload_osimis,
    view_osimis,
    view_aiViewer,
    view_ohif,
    download_report,
    print_report,
    view_padiLabel

  ) {

    return db.Role.create({
      name: name,
      import: importR,
      content: content,
      anon: anon,
      export_local: exportLocal,
      export_extern: exportExtern,
      query: query,
      auto_query: autoQuery,
      delete: deleteR,
      modify: modify,
      cd_burner: cd_burner,
      create_report: create_report,
      sharing: sharing,
      card_sharing: card_sharing,
      autorouting: autorouting,
      admin: admin,
      premium: premium,
      create_patient_report: create_patient_report,
      edit_patient_report: edit_patient_report,
      view_patient_report: view_patient_report,
      request_patient_report: request_patient_report,
      delete_report: delete_report,
      addendun: addendun,
      can_finalize_report: can_finalize_report,
      view_request_report: view_request_report,
      delete_req_report: delete_req_report,
      can_change_report_status: can_change_report_status,
      report_with_pdf: report_with_pdf,
      view_imagin,
      delete_imagin,
      can_req_imaging,
      can_add_radiologist_email,
      can_view_assign_caselist,
      can_view_admin_caselist,
      can_assign_doctors,
      can_download_zip,
      can_add_table,
      share_card_download,
      meddream: meddream,
      view_and_download_light: view_and_download_light,
      view_monitoring,
      view_system_monitoring,
      view_user_activity,
      view_my_dashboard,
      signature_compulsory,
      moderator,
      doctor_description_required,
      request_scan,
      request_scan_calender,
      request_scan_list,
      usg_no,
      can_delete_request_scan,
      view_wsi,
      share_card_wsi,
      add_manufacture,
      add_vendor,
      add_store_location,
      view_manufacture,
      view_vendor,
      view_store_location,
      change_inventory_min_qty,
      change_inventory_qty,
      delete_record_excel,
      save_inventory,
      delete_inventory,
      use_inventory,
      view_inventory,
      view_maintance,
      edit_inventory,
      can_assign_report_by_role,
      can_view_uploader,
      can_create_uploader,
      can_search_ref_physician,
      can_add_logo,
      can_search_institution,
      can_register_patient,
      can_view_appointment,
      can_view_demographic,
      see_report_label,
      edit_report_label,
      see_report_type,
      edit_report_type,
      limit,
      view_registered_user,

      main_table_checkbox,
      main_table_status,
      main_table_detail,
      main_table_date,
      main_table_time,
      main_table_patient_name,
      main_table_patient_id,
      main_table_accession,
      main_table_description,
      main_table_gender,
      main_table_dob,
      main_table_age,
      main_table_selectBtn,
      main_table_viewBtn,
      main_table_reportBtn,

      can_request_feature,
      can_view_request_feature,
      main_table_patient_select,
      delete_request_feature,
      can_transfer,
      generate_series,
      create_dataset,
      dataset_request,
      download_dataset_excel,
      view_dataset,
      view_my_dataset,
      copy_osimis,
      copy_stone,
      copy_download_zip,
      main_table_modality_view,
      delete_dataset,
      manage_report_template,
      send_report_dicom,
      manage_auto_send_ai,
      patient_management,
      view_radiant,
      view_horos,
      view_weasis,
      preload_osimis,
      view_osimis,
      view_aiViewer,
      view_ohif,
      download_report,
      print_report,
      view_padiLabel
    });
  }

  static async getRoleByName(name) {
    return db.Role.findOne({ where: { name: name } });
  }

  static async delete(name) {
    const role = await Role.getRole(name);
    if (role == null) {
      throw new OTJSDBEntityNotFoundException("This role doesn't exist");
    }
    return db.Role.destroy({ where: { name: name } });
  }

  //voir pour faire avec un getEntity, modification de l'entity puis .save()
  static async update(name,
    importR,
    content,
    anon,
    exportLocal,
    exportExtern,
    query,
    autoQuery,
    deleteR,
    modify,
    cd_burner,
    create_report,
    sharing,
    card_sharing,
    autorouting,
    admin,
    premium,
    create_patient_report,
    edit_patient_report,
    view_patient_report,
    request_patient_report,
    delete_report,
    addendun,
    can_finalize_report,
    view_request_report,
    delete_req_report,
    can_change_report_status,
    report_with_pdf,
    view_imagin,
    delete_imagin,
    can_req_imaging,
    can_add_radiologist_email,
    can_view_assign_caselist,
    can_view_admin_caselist,
    can_assign_doctors,
    can_download_zip,
    can_add_table,
    share_card_download,
    meddream,
    view_and_download_light,
    view_monitoring,
    view_system_monitoring,
    view_user_activity,
    view_my_dashboard,
    signature_compulsory,
    moderator,
    doctor_description_required,
    request_scan,
    request_scan_calender,
    request_scan_list,
    usg_no,
    can_delete_request_scan,
    view_wsi,
    share_card_wsi,
    add_manufacture,
    add_vendor,
    add_store_location,
    view_manufacture,
    view_vendor,
    view_store_location,
    change_inventory_min_qty,
    change_inventory_qty,
    delete_record_excel,
    save_inventory,
    delete_inventory,
    use_inventory,
    view_inventory,
    view_maintance,
    edit_inventory,
    can_assign_report_by_role,
    can_view_uploader,
    can_create_uploader,
    can_search_ref_physician,
    can_add_logo,
    can_search_institution,
    can_register_patient,
    can_view_appointment,
    can_view_demographic,
    see_report_label,
    edit_report_label,
    see_report_type,
    edit_report_type,
    limit,
    view_registered_user,
    main_table_checkbox,
    main_table_status,
    main_table_detail,
    main_table_date,
    main_table_time,
    main_table_patient_name,
    main_table_patient_id,
    main_table_accession,
    main_table_description,
    main_table_gender,
    main_table_dob,
    main_table_age,
    main_table_selectBtn,
    main_table_viewBtn,
    main_table_reportBtn,
    can_request_feature,
    can_view_request_feature,
    main_table_patient_select,
    delete_request_feature,
    can_transfer,
    generate_series,
    create_dataset,
    dataset_request,
    download_dataset_excel,
    view_dataset,
    view_my_dataset,
    copy_osimis,
    copy_stone,
    copy_download_zip,
    main_table_modality_view,
    delete_dataset,
    manage_report_template,
    send_report_dicom,
    manage_auto_send_ai,
    patient_management,
    view_radiant,
    view_horos,
    view_weasis,
      preload_osimis,
    view_osimis,
    view_aiViewer,
    view_ohif,
    download_report,
    print_report,
    view_padiLabel
  ) {
    const role = await Role.getRole(name);
    if (role == null) {
      throw new OTJSDBEntityNotFoundException("This role doesn't exist");
    }

    role.import = importR;
    role.content = content;
    role.anon = anon;
    role.exportLocal = exportLocal;
    role.exportExtern = exportExtern;
    role.query = query;
    role.autoQuery = autoQuery;
    role.delete = deleteR;
    role.modify = modify;
    role.cd_burner = cd_burner;
    role.create_report = create_report;
    role.sharing = sharing;
    role.card_sharing = card_sharing;
    role.autorouting = autorouting;
    role.admin = admin;
    role.premium = premium;
    role.create_patient_report = create_patient_report;
    role.edit_patient_report = edit_patient_report;
    role.view_patient_report = view_patient_report;
    role.request_patient_report = request_patient_report;
    role.delete_report = delete_report;
    role.addendun = addendun;
    role.can_finalize_report = can_finalize_report;
    role.view_request_report = view_request_report;
    role.delete_req_report = delete_req_report;
    role.can_change_report_status = can_change_report_status;
    role.report_with_pdf = report_with_pdf;
    role.view_imagin = view_imagin;
    role.delete_imagin = delete_imagin;
    role.can_req_imaging = can_req_imaging;
    role.can_add_radiologist_email = can_add_radiologist_email;
    role.can_view_assign_caselist = can_view_assign_caselist;
    role.can_view_admin_caselist = can_view_admin_caselist;
    role.can_assign_doctors = can_assign_doctors;
    role.can_download_zip = can_download_zip;
    role.can_add_table = can_add_table;
    role.share_card_download = share_card_download;
    role.meddream = meddream;
    role.view_and_download_light = view_and_download_light;
    role.view_monitoring = view_monitoring;
    role.view_system_monitoring = view_system_monitoring;
    role.view_user_activity = view_user_activity;
    role.view_my_dashboard = view_my_dashboard;
    role.signature_compulsory = signature_compulsory;
    role.moderator = moderator;
    role.doctor_description_required = doctor_description_required;
    role.request_scan = request_scan;
    role.request_scan_calender = request_scan_calender;
    role.request_scan_list = request_scan_list;
    role.usg_no = usg_no;
    role.can_delete_request_scan=can_delete_request_scan;
    role.view_wsi=view_wsi;
    role.share_card_wsi=share_card_wsi;
    role.add_manufacture=add_manufacture;
    role.add_vendor=add_vendor;
    role.add_store_location=add_store_location;
    role.view_manufacture=view_manufacture;
    role.view_vendor=view_vendor;
    role.view_store_location=view_store_location;
    role.change_inventory_min_qty=change_inventory_min_qty;
    role.change_inventory_qty=change_inventory_qty;
    role.delete_record_excel=delete_record_excel;
    role.save_inventory=save_inventory;
    role.delete_inventory=delete_inventory;
    role.use_inventory=use_inventory;
    role.view_inventory=view_inventory;
    role.view_maintance=view_maintance;
    role.edit_inventory=edit_inventory; 
    role.can_assign_report_by_role=can_assign_report_by_role;
    role.can_view_uploader=can_view_uploader;
    role.can_create_uploader=can_create_uploader;
    role.can_search_ref_physician=can_search_ref_physician;
    role.can_add_logo=can_add_logo;
    role.can_search_institution=can_search_institution;
    role.can_register_patient=can_register_patient;
    role.can_view_appointment=can_view_appointment;
    role.can_view_demographic=can_view_demographic;
    role.see_report_label=see_report_label;
    role.edit_report_label=edit_report_label;
    role.see_report_type=see_report_type;
    role.edit_report_type=edit_report_type;
    role.limit=limit;
    role.view_registered_user=view_registered_user;
    role.main_table_checkbox=main_table_checkbox;
    role.main_table_status=main_table_status;
    role.main_table_detail=main_table_detail;
    role.main_table_date=main_table_date;
    role.main_table_time=main_table_time;
    role.main_table_patient_name=main_table_patient_name;
    role.main_table_patient_id=main_table_patient_id;
    role.main_table_accession=main_table_accession;
    role.main_table_description=main_table_description;
    role.main_table_gender=main_table_gender;
    role.main_table_dob=main_table_dob;
    role.main_table_age=main_table_age;
    role.main_table_selectBtn=main_table_selectBtn;
    role.main_table_viewBtn=main_table_viewBtn;
    role.main_table_reportBtn=main_table_reportBtn;
    role.can_request_feature=can_request_feature;
    role.can_view_request_feature=can_view_request_feature;
    role.main_table_patient_select=main_table_patient_select;
    role.delete_request_feature=delete_request_feature;
    role.can_transfer=can_transfer;
    role.generate_series=generate_series;
    role.create_dataset=create_dataset;
    role.dataset_request=dataset_request;
    role.download_dataset_excel=download_dataset_excel;
    role.view_dataset=view_dataset;
    role.view_my_dataset=view_my_dataset;
    role.copy_osimis=copy_osimis;
    role.copy_stone=copy_stone;
    role.copy_download_zip=copy_download_zip;
    role.main_table_modality_view=main_table_modality_view;
    role.delete_dataset=delete_dataset;
    role.manage_report_template=manage_report_template;
    role.send_report_dicom=send_report_dicom;
    role.manage_auto_send_ai=manage_auto_send_ai;
    role.patient_management=patient_management;
    role.view_radiant=view_radiant;
    role.view_horos=view_horos;
    role.view_weasis=view_weasis;
    role.preload_osimis=preload_osimis;
    role.view_osimis=view_osimis;
    role.view_aiViewer=view_aiViewer;
    role.view_ohif=view_ohif;
    role.download_report=download_report;
    role.print_report=print_report;
    role.view_padiLabel=view_padiLabel;
    return role.save();
  }

}


module.exports = Role;
