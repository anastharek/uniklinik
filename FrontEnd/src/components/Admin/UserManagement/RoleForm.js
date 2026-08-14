import React, { Component, Fragment } from "react";
import Toggle from "react-toggle";
import { Row, Col } from "react-bootstrap";
export default class RoleForm extends Component {
  state = {
    import: false,
    content: false,
    anon: false,
    export_local: false,
    export_extern: false,
    query: false,
    auto_query: false,
    delete: false,
    admin: false,
    modify: false,
    cd_burner: false,
    create_report: false,
    sharing: false,
    card_sharing: false,
    autorouting: false,
    premium: false,
    create_patient_report: false,
    edit_patient_report: false,
    view_patient_report: false,
    request_patient_report: false,
    delete_report: false,
    addendun: false,
    delete_req_report: false,
    can_change_report_status: false,
    report_with_pdf: false,
    view_imagin: false,
    delete_imagin: false,
    can_req_imaging: false,
    can_add_radiologist_email: false,
    can_view_assign_caselist: false,
    can_view_admin_caselist: false,
    can_assign_doctors: false,
    can_add_table: false,
    can_download_zip: false,
    share_card_download: false,
    meddream: false,
    view_and_download_light: false,
    view_monitoring: false,
    view_system_monitoring: false,
    view_user_activity: false,
    view_my_dashboard: false,
    signature_compulsory: false,
    moderator: false,
    doctor_description_required: false,
    request_scan: false,
    request_scan_calender: false,
    request_scan_list: false,
    usg_no: false,
    can_delete_request_scan:false,
    view_wsi:false,
    share_card_wsi:false,
    add_manufacture:false,
    add_vendor:false,
    add_store_location:false,
    change_inventory_min_qty:false,
    change_inventory_qty:false,
    delete_record_excel:false,
    save_inventory:false,
    delete_inventory:false,
    use_inventory:false,
    view_inventory:false,
    view_maintance:false,
    edit_inventory:false,
    can_assign_report_by_role:false,
    can_view_uploader:false,
    can_create_uploader:false,
    can_search_ref_physician:false,
    can_add_logo:false,
    can_search_institution:false,
    can_register_patient:false,
    can_view_appointment:false,
    can_view_demographic:false,
    see_report_label:false,
    edit_report_label:false,
    see_report_type:false,
    edit_report_type:false,
    limit:'',
    view_registered_user:false,
    main_table_checkbox:false,
    main_table_status:false,
    main_table_detail:false,
    main_table_date:false,
    main_table_time:false,
    main_table_patient_name:false,
    main_table_patient_id:false,
    main_table_accession:false,
    main_table_description:false,
    main_table_gender:false,
    main_table_dob:false,
    main_table_age:false,
    main_table_selectBtn:false,
    main_table_viewBtn:false,
    main_table_reportBtn:false,
    can_request_feature:false,
    can_view_request_feature:false,
    main_table_patient_select:false,
    delete_request_feature:false,
    generate_series:false,
    create_dataset:false,
    dataset_request:false,
    download_dataset_excel:false,
    view_dataset:false,
    view_my_dataset:false,
    copy_osimis:false,
    copy_stone:false,
    copy_download_zip:false,
    main_table_modality_view:false,
    delete_dataset:false,
    manage_report_template:false,
    send_report_dicom:false,
    manage_auto_send_ai:false,
    patient_management:false,
    view_radiant:false,
    view_horos:false,
    view_weasis:false,
    preload_osimis:false,
    view_osimis:false,
    view_aiViewer:false,
    view_ohif:false,
    download_report:false,
    print_report:false,
    view_padiLabel:false,
  };

  componentDidMount = () => {
    if (this.props.data != null) {
      this.setState({
        import: this.props.data.import,
        content: this.props.data.content,
        anon: this.props.data.anon,
        exportLocal: this.props.data.export_local,
        exportExtern: this.props.data.export_extern,
        query: this.props.data.query,
        autoQuery: this.props.data.auto_query,
        delete: this.props.data.delete,
        admin: this.props.data.admin,
        modify: this.props.data.modify,
        cd_burner: this.props.data.cd_burner,
        create_report: this.props.data.create_report,
        sharing: this.props.data.sharing,
        card_sharing: this.props.data.card_sharing,
        autorouting: this.props.data.autorouting,
        premium: this.props.data.premium,
        create_patient_report: this.props.data.create_patient_report,
        edit_patient_report: this.props.data.edit_patient_report,
        view_patient_report: this.props.data.view_patient_report,
        request_patient_report: this.props.data.request_patient_report,
        delete_report: this.props.data.delete_report,
        addendun: this.props.data.addendun,
        can_finalize_report: this.props.data.can_finalize_report,
        view_request_report: this.props.data.view_request_report,
        delete_req_report: this.props.data.delete_req_report,
        can_change_report_status: this.props.data.can_change_report_status,
        report_with_pdf: this.props.data.report_with_pdf,
        view_imagin: this.props.data.view_imagin,
        delete_imagin: this.props.data.delete_imagin,
        can_req_imaging: this.props.data.can_req_imaging,
        can_add_radiologist_email: this.props.data.can_add_radiologist_email,
        can_view_assign_caselist: this.props.data.can_view_assign_caselist,
        can_view_admin_caselist: this.props.data.can_view_admin_caselist,
        can_assign_doctors: this.props.data.can_assign_doctors,
        can_add_table: this.props.data.can_add_table,
        can_download_zip: this.props.data.can_download_zip,
        share_card_download: this.props.data.share_card_download,
        meddream: this.props.data.meddream,
        view_and_download_light: this.props.data.view_and_download_light,
        view_monitoring: this.props.data.view_monitoring,
        view_system_monitoring: this.props.data.view_system_monitoring,
        view_user_activity: this.props.data.view_user_activity,
        view_my_dashboard: this.props.data.view_my_dashboard,
        signature_compulsory: this.props.data.signature_compulsory,
        moderator: this.props.data.moderator,
        doctor_description_required:
          this.props.data.doctor_description_required,
        request_scan: this.props.data.request_scan,
        request_scan_calender: this.props.data.request_scan_calender,
        request_scan_list: this.props.data.request_scan_list,
        usg_no: this.props.data.usg_no,
        can_delete_request_scan:this.props.data.can_delete_request_scan,
        view_wsi:this.props.data.view_wsi,
        share_card_wsi:this.props.data.share_card_wsi,

        add_manufacture:this.props.data.add_manufacture,
        add_vendor:this.props.data.add_vendor,
        add_store_location:this.props.data.add_store_location,

        view_manufacture:this.props.data.view_manufacture,
        view_vendor:this.props.data.view_vendor,
        view_store_location:this.props.data.view_store_location,

        change_inventory_min_qty:this.props.data.change_inventory_min_qty,
        change_inventory_qty:this.props.data.change_inventory_qty,
        delete_record_excel:this.props.data.delete_record_excel,
        save_inventory:this.props.data.save_inventory,
        delete_inventory:this.props.data.delete_inventory,
        use_inventory:this.props.data.use_inventory,
        view_inventory:this.props.data.view_inventory,
        view_maintance:this.props.data.view_maintance,
        edit_inventory:this.props.data.edit_inventory,

        can_assign_report_by_role:this.props.data.can_assign_report_by_role,
        can_view_uploader:this.props.data.can_view_uploader,
        can_create_uploader:this.props.data.can_create_uploader,
        can_search_ref_physician:this.props.data.can_search_ref_physician,
        can_add_logo:this.props.data.can_add_logo,
        
        can_search_institution:this.props.data.can_search_institution,
        can_register_patient:this.props.data.can_register_patient,
        can_view_appointment:this.props.data.can_view_appointment,
        can_view_demographic:this.props.data.can_view_demographic,
      
        see_report_label:this.props.data.see_report_label,
        edit_report_label:this.props.data.edit_report_label,
        see_report_type:this.props.data.see_report_type,
        edit_report_type:this.props.data.edit_report_type,
        limit:this.props.data.limit,
        view_registered_user:this.props.data.view_registered_user,
        
        main_table_checkbox:this.props.data.main_table_checkbox,
        main_table_status:this.props.data.main_table_status,
        main_table_detail:this.props.data.main_table_detail,
        main_table_date:this.props.data.main_table_date,
        main_table_time:this.props.data.main_table_time,
        main_table_patient_name:this.props.data.main_table_patient_name,
        main_table_patient_id:this.props.data.main_table_patient_id,
        main_table_accession:this.props.data.main_table_accession,
        main_table_description:this.props.data.main_table_description,
        main_table_gender:this.props.data.main_table_gender,
        main_table_dob:this.props.data.main_table_dob,
        main_table_age:this.props.data.main_table_age,
        main_table_selectBtn:this.props.data.main_table_selectBtn,
        main_table_viewBtn:this.props.data.main_table_viewBtn,
        main_table_reportBtn:this.props.data.main_table_reportBtn,
        
        can_request_feature:this.props.data.can_request_feature,
        can_view_request_feature:this.props.data.can_view_request_feature,
        main_table_patient_select:this.props.data.main_table_patient_select,
        delete_request_feature:this.props.data.delete_request_feature,
        can_transfer:this.props.data.can_transfer,
        generate_series:this.props.data.generate_series,
        create_dataset:this.props.data.create_dataset,
        dataset_request:this.props.data.dataset_request,
        download_dataset_excel:this.props.data.download_dataset_excel,
        view_dataset:this.props.data.view_dataset,
        view_my_dataset:this.props.data.view_my_dataset,
        copy_osimis:this.props.data.copy_osimis,
        copy_stone:this.props.data.copy_stone,
        copy_download_zip:this.props.data.copy_download_zip,
        main_table_modality_view:this.props.data.main_table_modality_view,
        delete_dataset:this.props.data.delete_dataset,
        manage_report_template:this.props.data.manage_report_template,
        send_report_dicom:this.props.data.send_report_dicom,
        manage_auto_send_ai:this.props.data.manage_auto_send_ai,
        patient_management:this.props.data.patient_management,
        view_radiant:this.props.data.view_radiant,
        view_horos:this.props.data.view_horos,
        view_weasis:this.props.data.view_weasis,
        preload_osimis:this.props.data.preload_osimis,
        view_osimis:this.props.data.view_osimis,
        view_aiViewer:this.props.data.view_aiViewer,
        view_ohif:this.props.data.view_ohif,
        download_report:this.props.data.download_report,
        print_report:this.props.data.print_report,
        view_padiLabel:this.props.data.view_padiLabel,
      });
    }
  };

  render = () => {
    return (
      <Fragment>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Administration</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.admin}
              onChange={() =>
                this.setState((prevState) => ({ admin: !prevState.admin }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Limit</h5>
          </Col>
          <Col sm={7}>
            <input 
              type="number"
              className="form-control"
              style={{width:150}}
              value={this.state.limit}
              onChange={(e)=>this.setState({limit:e.target.value})}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Patient Search</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.content}
              onChange={() =>
                this.setState((prevState) => ({ content: !prevState.content }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Uploader</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.import}
              onChange={() =>
                this.setState((prevState) => ({ import: !prevState.import }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Create Study w/o Image</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.create_report}
              onChange={() =>
                this.setState((prevState) => ({
                  create_report: !prevState.create_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) My Caselist</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_assign_caselist}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_assign_caselist: !prevState.can_view_assign_caselist,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Trace Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_admin_caselist}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_admin_caselist: !prevState.can_view_admin_caselist,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Request Report List</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_request_report}
              onChange={() =>
                this.setState((prevState) => ({
                  view_request_report: !prevState.view_request_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Advance Imaging List </h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_imagin}
              onChange={() =>
                this.setState((prevState) => ({
                  view_imagin: !prevState.view_imagin,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5> (NavBar) Request Scan</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.request_scan}
              onChange={() =>
                this.setState((prevState) => ({
                  request_scan: !prevState.request_scan,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Request Scan List</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.request_scan_list}
              onChange={() =>
                this.setState((prevState) => ({
                  request_scan_list: !prevState.request_scan_list,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Request Scan Calendar</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.request_scan_calender}
              onChange={() =>
                this.setState((prevState) => ({
                  request_scan_calender: !prevState.request_scan_calender,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(NavBar) Monitoring</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_monitoring}
              onChange={() =>
                this.setState((prevState) => ({
                  view_monitoring: !prevState.view_monitoring,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) CheckBox</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_checkbox}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_checkbox: !prevState.main_table_checkbox,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Can Transfer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_transfer}
              onChange={() =>
                this.setState((prevState) => ({
                  can_transfer: !prevState.can_transfer,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Report Status</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_status}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_status: !prevState.main_table_status,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Detail</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_detail}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_detail: !prevState.main_table_detail,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Date</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_date}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_date: !prevState.main_table_date,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Time</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_time}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_time: !prevState.main_table_time,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Patient Name</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_patient_name}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_patient_name: !prevState.main_table_patient_name,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Patient ID</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_patient_id}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_patient_id: !prevState.main_table_patient_id,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Accession</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_accession}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_accession: !prevState.main_table_accession,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Modality</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_modality_view}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_modality_view: !prevState.main_table_modality_view,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Description</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_description}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_description: !prevState.main_table_description,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Gender</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_gender}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_gender: !prevState.main_table_gender,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) DOB</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_dob}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_dob: !prevState.main_table_dob,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Age</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_age}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_age: !prevState.main_table_age,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Select Btn</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_selectBtn}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_selectBtn: !prevState.main_table_selectBtn,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) View Btn</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_viewBtn}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_viewBtn: !prevState.main_table_viewBtn,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Report Btn</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_reportBtn}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_reportBtn: !prevState.main_table_reportBtn,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Main Table) Select Study Btn</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.main_table_patient_select}
              onChange={() =>
                this.setState((prevState) => ({
                  main_table_patient_select: !prevState.main_table_patient_select,
                }))
              }
            />
          </Col>
        </Row>

     
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Approve User</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.moderator}
              onChange={() =>
                this.setState((prevState) => ({
                  moderator: !prevState.moderator,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Request Feature</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_request_feature}
              onChange={() =>
                this.setState((prevState) => ({
                  can_request_feature: !prevState.can_request_feature,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can View Request Feature</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_request_feature}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_request_feature: !prevState.can_view_request_feature,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Delete Request Feature</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_request_feature}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_request_feature: !prevState.delete_request_feature,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Anonymisation</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.anon}
              onChange={() =>
                this.setState((prevState) => ({ anon: !prevState.anon }))
              }
            />
          </Col>
        </Row>
        {/* <Row className="mt-3">
          <Col sm={5}>
            <h5>Auto-Query</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.autoQuery}
              onChange={() =>
                this.setState((prevState) => ({
                  autoQuery: !prevState.autoQuery,
                }))
              }
            />
          </Col>
        </Row> */}
        
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Delete Case</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete}
              onChange={() =>
                this.setState((prevState) => ({ delete: !prevState.delete }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Local Export</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.exportLocal}
              onChange={() =>
                this.setState((prevState) => ({
                  exportLocal: !prevState.exportLocal,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Remote Export</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.exportExtern}
              onChange={() =>
                this.setState((prevState) => ({
                  exportExtern: !prevState.exportExtern,
                }))
              }
            />
          </Col>
        </Row>
        {/* <Row className="mt-3">
          <Col sm={5}>
            <h5>Query</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.query}
              onChange={() =>
                this.setState((prevState) => ({ query: !prevState.query }))
              }
            />
          </Col>
        </Row> */}
       
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Modify Metadata</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.modify}
              onChange={() =>
                this.setState((prevState) => ({ modify: !prevState.modify }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>CD Burner</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.cd_burner}
              onChange={() =>
                this.setState((prevState) => ({
                  cd_burner: !prevState.cd_burner,
                }))
              }
            />
          </Col>
        </Row>
        
        {/* <Row className="mt-3">
          <Col sm={5}>
            <h5>Sharing</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.sharing}
              onChange={() =>
                this.setState((prevState) => ({ sharing: !prevState.sharing }))
              }
            />
          </Col>
        </Row> */}
        {/* <Row className="mt-3">
          <Col sm={5}>
            <h5>Card sharing</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.card_sharing}
              onChange={() =>
                this.setState((prevState) => ({
                  card_sharing: !prevState.card_sharing,
                }))
              }
            />
          </Col>
        </Row> */}
        {/* <Row className="mt-3">
          <Col sm={5}>
            <h5>Premiun Card Sharing</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.premium}
              onChange={() =>
                this.setState((prevState) => ({ premium: !prevState.premium }))
              }
            />
          </Col>
        </Row> */}
        
        

        
        
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Assign Radiologist</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_assign_doctors}
              onChange={() =>
                this.setState((prevState) => ({
                  can_assign_doctors: !prevState.can_assign_doctors,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Assign by Roles</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_assign_report_by_role}
              onChange={() =>
                this.setState((prevState) => ({
                  can_assign_report_by_role: !prevState.can_assign_report_by_role,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Create Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.create_patient_report}
              onChange={() =>
                this.setState((prevState) => ({
                  create_patient_report: !prevState.create_patient_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Edit Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.edit_patient_report}
              onChange={() =>
                this.setState((prevState) => ({
                  edit_patient_report: !prevState.edit_patient_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Addendum</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.addendun}
              onChange={() =>
                this.setState((prevState) => ({
                  addendun: !prevState.addendun,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Finalize</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_finalize_report}
              onChange={() =>
                this.setState((prevState) => ({
                  can_finalize_report: !prevState.can_finalize_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) View Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_patient_report}
              onChange={() =>
                this.setState((prevState) => ({
                  view_patient_report: !prevState.view_patient_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Delete</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_report}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_report: !prevState.delete_report,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Can Upload Image</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.report_with_pdf}
              onChange={() =>
                this.setState((prevState) => ({
                  report_with_pdf: !prevState.report_with_pdf,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Report) Can Add Table</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_add_table}
              onChange={() =>
                this.setState((prevState) => ({
                  can_add_table: !prevState.can_add_table,
                }))
              }
            />
          </Col>
        </Row>

        

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Request Report) Request</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.request_patient_report}
              onChange={() =>
                this.setState((prevState) => ({
                  request_patient_report: !prevState.request_patient_report,
                }))
              }
            />
          </Col>
        </Row>
       

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Request Report) Delete Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_req_report}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_req_report: !prevState.delete_req_report,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Request Report) Change Status of Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_change_report_status}
              onChange={() =>
                this.setState((prevState) => ({
                  can_change_report_status: !prevState.can_change_report_status,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Request Report) Add Radiologist Email</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_add_radiologist_email}
              onChange={() =>
                this.setState((prevState) => ({
                  can_add_radiologist_email:
                    !prevState.can_add_radiologist_email,
                }))
              }
            />
          </Col>
        </Row>

       

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Advance Imaging) Request</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_req_imaging}
              onChange={() =>
                this.setState((prevState) => ({
                  can_req_imaging: !prevState.can_req_imaging,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>(Advance Imaging) Delete </h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_imagin}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_imagin: !prevState.delete_imagin,
                }))
              }
            />
          </Col>
        </Row>

        
        
        <Row className="mt-3">
          <Col sm={5}>
            <h5> (Request Scan) Delete</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_delete_request_scan}
              onChange={() =>
                this.setState((prevState) => ({
                  can_delete_request_scan: !prevState.can_delete_request_scan,
                }))
              }
            />
          </Col>
        </Row>
        

        <Row className="mt-3">
          <Col sm={5}>
            <h5>QR Share Card Download - OSIMIS Viewer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.share_card_download}
              onChange={() =>
                this.setState((prevState) => ({
                  share_card_download: !prevState.share_card_download,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>QR Share Card Download- AI/OR Viewer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_and_download_light}
              onChange={() =>
                this.setState((prevState) => ({
                  view_and_download_light: !prevState.view_and_download_light,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>WSI Share Card </h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.share_card_wsi}
              onChange={() =>
                this.setState((prevState) => ({
                  share_card_wsi: !prevState.share_card_wsi,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View WSI</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_wsi}
              onChange={() =>
                this.setState((prevState) => ({
                  view_wsi: !prevState.view_wsi,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Viewer - Orthanc Viewer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.meddream}
              onChange={() =>
                this.setState((prevState) => ({
                  meddream: !prevState.meddream,
                }))
              }
            />
          </Col>
        </Row>

        

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Download DICOM in zip</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_download_zip}
              onChange={() =>
                this.setState((prevState) => ({
                  can_download_zip: !prevState.can_download_zip,
                }))
              }
            />
          </Col>
        </Row>
       
        
        
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Monitoring - System Monitoring</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_system_monitoring}
              onChange={() =>
                this.setState((prevState) => ({
                  view_system_monitoring: !prevState.view_system_monitoring,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Monitoring - User Activity (View all user activity)</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_user_activity}
              onChange={() =>
                this.setState((prevState) => ({
                  view_user_activity: !prevState.view_user_activity,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Monitoring - My Dashboard (only view my activity)</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_my_dashboard}
              onChange={() =>
                this.setState((prevState) => ({
                  view_my_dashboard: !prevState.view_my_dashboard,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>signature compulsory</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.signature_compulsory}
              onChange={() =>
                this.setState((prevState) => ({
                  signature_compulsory: !prevState.signature_compulsory,
                }))
              }
            />
          </Col>
        </Row>

        

        <Row className="mt-3">
          <Col sm={5}>
            <h5> My Profile - Doctor Description (Compulsory)</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.doctor_description_required}
              onChange={() =>
                this.setState((prevState) => ({
                  doctor_description_required:
                    !prevState.doctor_description_required,
                }))
              }
            />
          </Col>
        </Row>
        
        

        
        

        <Row className="mt-3">
          <Col sm={5}>
            <h5> View Manufacture</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_manufacture}
              onChange={() =>
                this.setState((prevState) => ({
                  view_manufacture: !prevState.view_manufacture,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5> View Vendor</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_vendor}
              onChange={() =>
                this.setState((prevState) => ({
                  view_vendor: !prevState.view_vendor,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5> View Store Location</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_store_location}
              onChange={() =>
                this.setState((prevState) => ({
                  view_store_location: !prevState.view_store_location,
                }))
              }
            />
          </Col>
        </Row>
        
        <Row className="mt-3">
          <Col sm={5}>
            <h5> Add Manufacture</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.add_manufacture}
              onChange={() =>
                this.setState((prevState) => ({
                  add_manufacture: !prevState.add_manufacture,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5> Add Vendor</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.add_vendor}
              onChange={() =>
                this.setState((prevState) => ({
                  add_vendor: !prevState.add_vendor,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5> Add Store Location</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.add_store_location}
              onChange={() =>
                this.setState((prevState) => ({
                  add_store_location: !prevState.add_store_location,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Change Inventory Min Qty</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.change_inventory_min_qty}
              onChange={() =>
                this.setState((prevState) => ({
                  change_inventory_min_qty: !prevState.change_inventory_min_qty,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Change Inventory  Qty</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.change_inventory_qty}
              onChange={() =>
                this.setState((prevState) => ({
                  change_inventory_qty: !prevState.change_inventory_qty,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Delete Record Excel</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_record_excel}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_record_excel: !prevState.delete_record_excel,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Save Inventory</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.save_inventory}
              onChange={() =>
                this.setState((prevState) => ({
                  save_inventory: !prevState.save_inventory,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Delete Inventory</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_inventory}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_inventory: !prevState.delete_inventory,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Use Inventory</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.use_inventory}
              onChange={() =>
                this.setState((prevState) => ({
                  use_inventory: !prevState.use_inventory,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Inventory Monitoring</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_inventory}
              onChange={() =>
                this.setState((prevState) => ({
                  view_inventory: !prevState.view_inventory,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Maintance</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_maintance}
              onChange={() =>
                this.setState((prevState) => ({
                  view_maintance: !prevState.view_maintance,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Edit Inventory</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.edit_inventory}
              onChange={() =>
                this.setState((prevState) => ({
                  edit_inventory: !prevState.edit_inventory,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5> USG NO</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.usg_no}
              onChange={() =>
                this.setState((prevState) => ({
                  usg_no: !prevState.usg_no,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Dicom Router</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.autorouting}
              onChange={() =>
                this.setState((prevState) => ({
                  autorouting: !prevState.autorouting,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Uploader</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_uploader}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_uploader: !prevState.can_view_uploader,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Create Uploader</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_create_uploader}
              onChange={() =>
                this.setState((prevState) => ({
                  can_create_uploader: !prevState.can_create_uploader,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Search By Ref. Physician</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_search_ref_physician}
              onChange={() =>
                this.setState((prevState) => ({
                  can_search_ref_physician: !prevState.can_search_ref_physician,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Add Custome Logo</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_add_logo}
              onChange={() =>
                this.setState((prevState) => ({
                  can_add_logo: !prevState.can_add_logo,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Search By InstitutionName</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_search_institution}
              onChange={() =>
                this.setState((prevState) => ({
                  can_search_institution: !prevState.can_search_institution,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can Register Patient</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_register_patient}
              onChange={() =>
                this.setState((prevState) => ({
                  can_register_patient: !prevState.can_register_patient,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can View Demographic Appontment</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_appointment}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_appointment: !prevState.can_view_appointment,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Can View Demographic</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.can_view_demographic}
              onChange={() =>
                this.setState((prevState) => ({
                  can_view_demographic: !prevState.can_view_demographic,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>See Report Label</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.see_report_label}
              onChange={() =>
                this.setState((prevState) => ({
                  see_report_label: !prevState.see_report_label,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Edit Report Label</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.edit_report_label}
              onChange={() =>
                this.setState((prevState) => ({
                  edit_report_label: !prevState.edit_report_label,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>See Report Type</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.see_report_type}
              onChange={() =>
                this.setState((prevState) => ({
                  see_report_type: !prevState.see_report_type,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Edit Report Type</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.edit_report_type}
              onChange={() =>
                this.setState((prevState) => ({
                  edit_report_type: !prevState.edit_report_type,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View registered user</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_registered_user}
              onChange={() =>
                this.setState((prevState) => ({
                  view_registered_user: !prevState.view_registered_user,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Generate Ai Series</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.generate_series}
              onChange={() =>
                this.setState((prevState) => ({
                  generate_series: !prevState.generate_series,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Create Dataset</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.create_dataset}
              onChange={() =>
                this.setState((prevState) => ({
                  create_dataset: !prevState.create_dataset,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Dataset Req.</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.dataset_request}
              onChange={() =>
                this.setState((prevState) => ({
                  dataset_request: !prevState.dataset_request,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Download Dataset Excel</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.download_dataset_excel}
              onChange={() =>
                this.setState((prevState) => ({
                  download_dataset_excel: !prevState.download_dataset_excel,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Dataset</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_dataset}
              onChange={() =>
                this.setState((prevState) => ({
                  view_dataset: !prevState.view_dataset,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View My Dataset</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_my_dataset}
              onChange={() =>
                this.setState((prevState) => ({
                  view_my_dataset: !prevState.view_my_dataset,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Delete Dataset</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.delete_dataset}
              onChange={() =>
                this.setState((prevState) => ({
                  delete_dataset: !prevState.delete_dataset,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Copy Osimis Link</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.copy_osimis}
              onChange={() =>
                this.setState((prevState) => ({
                  copy_osimis: !prevState.copy_osimis,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Copy Stone Link</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.copy_stone}
              onChange={() =>
                this.setState((prevState) => ({
                  copy_stone: !prevState.copy_stone,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Copy download zip</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.copy_download_zip}
              onChange={() =>
                this.setState((prevState) => ({
                  copy_download_zip: !prevState.copy_download_zip,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Manage report template</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.manage_report_template}
              onChange={() =>
                this.setState((prevState) => ({
                  manage_report_template: !prevState.manage_report_template,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Send report dicom</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.send_report_dicom}
              onChange={() =>
                this.setState((prevState) => ({
                  send_report_dicom: !prevState.send_report_dicom,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Manage auto send ai</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.manage_auto_send_ai}
              onChange={() =>
                this.setState((prevState) => ({
                  manage_auto_send_ai: !prevState.manage_auto_send_ai,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>Patients Manage</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.patient_management}
              onChange={() =>
                this.setState((prevState) => ({
                  patient_management: !prevState.patient_management,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Radiant</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_radiant}
              onChange={() =>
                this.setState((prevState) => ({
                  view_radiant: !prevState.view_radiant,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Horos</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_horos}
              onChange={() =>
                this.setState((prevState) => ({
                  view_horos: !prevState.view_horos,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Weasis</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_weasis}
              onChange={() =>
                this.setState((prevState) => ({
                  view_weasis: !prevState.view_weasis,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Preload Osimis</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.preload_osimis}
              onChange={() =>
                this.setState((prevState) => ({
                  preload_osimis: !prevState.preload_osimis,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View Osimis</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_osimis}
              onChange={() =>
                this.setState((prevState) => ({
                  view_osimis: !prevState.view_osimis,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>View OHIF Viewer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_ohif}
              onChange={() =>
                this.setState((prevState) => ({
                  view_ohif: !prevState.view_ohif,
                }))
              }
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm={5}>
            <h5>View AI Viewer</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_aiViewer}
              onChange={() =>
                this.setState((prevState) => ({
                  view_aiViewer: !prevState.view_aiViewer,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Download Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.download_report}
              onChange={() =>
                this.setState((prevState) => ({
                  download_report: !prevState.download_report,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Print Report</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.print_report}
              onChange={() =>
                this.setState((prevState) => ({
                  print_report: !prevState.print_report,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col sm={5}>
            <h5>Manage Padi Label</h5>
          </Col>
          <Col sm={7}>
            <Toggle
              checked={this.state.view_padiLabel}
              onChange={() =>
                this.setState((prevState) => ({
                  view_padiLabel: !prevState.view_padiLabel,
                }))
              }
            />
          </Col>
        </Row>

        <Row className="mt-3 text-center">
          <Col>
            <button
              type="button"
              name="create"
              className="otjs-button otjs-button-blue"
              onClick={() => {
                this.props.onSubmitRole(this.state);
              }}
            >
              {" "}
              Validate{" "}
            </button>
          </Col>
        </Row>
      </Fragment>
    );
  };
}
