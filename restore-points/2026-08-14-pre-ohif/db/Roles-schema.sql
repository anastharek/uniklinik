--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1 (Debian 13.1-1.pgdg100+1)
-- Dumped by pg_dump version 13.1 (Debian 13.1-1.pgdg100+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Roles" (
    name character varying(255) NOT NULL,
    import boolean DEFAULT false,
    content boolean DEFAULT false,
    anon boolean DEFAULT false,
    export_local boolean DEFAULT false,
    export_extern boolean DEFAULT false,
    query boolean DEFAULT false,
    auto_query boolean DEFAULT false,
    delete boolean DEFAULT false,
    admin boolean DEFAULT false,
    modify boolean DEFAULT false,
    cd_burner boolean DEFAULT false,
    create_report boolean DEFAULT false,
    sharing boolean DEFAULT false,
    card_sharing boolean DEFAULT false,
    autorouting boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    premium boolean DEFAULT false,
    create_patient_report boolean DEFAULT false,
    edit_patient_report boolean DEFAULT false,
    view_patient_report boolean DEFAULT true,
    request_patient_report boolean DEFAULT true,
    delete_report boolean DEFAULT false,
    addendun boolean DEFAULT false,
    can_finalize_report boolean DEFAULT false,
    view_request_report boolean DEFAULT false,
    delete_req_report boolean DEFAULT false,
    can_change_report_status boolean DEFAULT false,
    report_with_pdf boolean DEFAULT false,
    view_imagin boolean DEFAULT false,
    delete_imagin boolean DEFAULT false,
    can_req_imaging boolean DEFAULT false,
    can_add_radiologist_email boolean DEFAULT false,
    can_view_admin_caselist boolean DEFAULT false,
    can_view_assign_caselist boolean DEFAULT false,
    can_assign_doctors boolean DEFAULT false,
    can_download_zip boolean DEFAULT false,
    can_add_table boolean DEFAULT false,
    share_card_download boolean DEFAULT false,
    meddream boolean DEFAULT false,
    view_and_download_light boolean DEFAULT false,
    view_monitoring boolean DEFAULT false,
    view_system_monitoring boolean DEFAULT false,
    view_user_activity boolean DEFAULT false,
    view_my_dashboard boolean DEFAULT false,
    signature_compulsory boolean DEFAULT false,
    moderator boolean DEFAULT false,
    doctor_description_required boolean DEFAULT false,
    request_scan boolean DEFAULT false,
    request_scan_calender boolean DEFAULT false,
    request_scan_list boolean DEFAULT false,
    usg_no boolean DEFAULT false,
    can_delete_request_scan boolean DEFAULT true,
    view_wsi boolean DEFAULT false,
    share_card_wsi boolean DEFAULT false,
    add_manufacture boolean DEFAULT false,
    add_store_location boolean DEFAULT false,
    add_vendor boolean DEFAULT false,
    view_manufacture boolean DEFAULT false,
    view_vendor boolean DEFAULT false,
    view_store_location boolean DEFAULT false,
    change_inventory_min_qty boolean DEFAULT false,
    change_inventory_qty boolean DEFAULT false,
    delete_record_excel boolean DEFAULT false,
    save_inventory boolean DEFAULT false,
    delete_inventory boolean DEFAULT false,
    use_inventory boolean DEFAULT false,
    view_inventory boolean DEFAULT false,
    view_maintance boolean DEFAULT false,
    edit_inventory boolean DEFAULT false,
    can_assign_report_by_role boolean DEFAULT false,
    can_view_uploader boolean DEFAULT false,
    can_create_uploader boolean DEFAULT false,
    can_search_ref_physician boolean DEFAULT false,
    can_add_logo boolean DEFAULT false,
    can_search_institution boolean DEFAULT false,
    can_register_patient boolean DEFAULT false,
    can_view_appointment boolean DEFAULT false,
    can_view_demographic boolean DEFAULT false,
    see_report_label boolean DEFAULT false,
    edit_report_label boolean DEFAULT false,
    edit_report_type boolean DEFAULT false,
    see_report_type boolean DEFAULT false,
    "limit" integer,
    view_registered_user boolean DEFAULT false,
    main_table_checkbox boolean DEFAULT false,
    main_table_status boolean DEFAULT false,
    main_table_detail boolean DEFAULT false,
    main_table_date boolean DEFAULT false,
    main_table_time boolean DEFAULT false,
    main_table_patient_name boolean DEFAULT false,
    main_table_patient_id boolean DEFAULT false,
    main_table_accession boolean DEFAULT false,
    main_table_description boolean DEFAULT false,
    main_table_gender boolean DEFAULT false,
    main_table_dob boolean DEFAULT false,
    main_table_age boolean DEFAULT false,
    "main_table_selectBtn" boolean DEFAULT false,
    "main_table_viewBtn" boolean DEFAULT false,
    "main_table_reportBtn" boolean DEFAULT false,
    can_request_feature boolean DEFAULT true,
    can_view_request_feature boolean DEFAULT true,
    main_table_patient_select boolean DEFAULT true,
    delete_request_feature boolean DEFAULT true,
    can_transfer boolean DEFAULT true,
    generate_series boolean DEFAULT false,
    create_dataset boolean DEFAULT false,
    dataset_request boolean DEFAULT false,
    download_dataset_excel boolean DEFAULT false,
    view_dataset boolean DEFAULT true,
    view_my_dataset boolean DEFAULT true,
    copy_osimis boolean DEFAULT false,
    copy_stone boolean DEFAULT false,
    copy_download_zip boolean DEFAULT false,
    main_table_modality_view boolean DEFAULT false,
    delete_dataset boolean DEFAULT false,
    manage_report_template boolean DEFAULT false,
    send_report_dicom boolean DEFAULT false,
    manage_auto_send_ai boolean DEFAULT false,
    patient_management boolean DEFAULT false,
    view_osimis boolean DEFAULT false,
    view_radiant boolean DEFAULT false,
    "view_aiViewer" boolean DEFAULT false,
    view_horos boolean DEFAULT false,
    download_report boolean DEFAULT false,
    print_report boolean DEFAULT false,
    "view_padiLabel" boolean DEFAULT false,
    view_weasis boolean DEFAULT false,
    preload_osimis boolean DEFAULT false
);


ALTER TABLE public."Roles" OWNER TO postgres;

--
-- Name: Roles Roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (name);


--
-- PostgreSQL database dump complete
--

