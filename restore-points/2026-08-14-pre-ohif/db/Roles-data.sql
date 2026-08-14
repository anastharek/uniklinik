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

--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Roles" (name, import, content, anon, export_local, export_extern, query, auto_query, delete, admin, modify, cd_burner, create_report, sharing, card_sharing, autorouting, "createdAt", "updatedAt", premium, create_patient_report, edit_patient_report, view_patient_report, request_patient_report, delete_report, addendun, can_finalize_report, view_request_report, delete_req_report, can_change_report_status, report_with_pdf, view_imagin, delete_imagin, can_req_imaging, can_add_radiologist_email, can_view_admin_caselist, can_view_assign_caselist, can_assign_doctors, can_download_zip, can_add_table, share_card_download, meddream, view_and_download_light, view_monitoring, view_system_monitoring, view_user_activity, view_my_dashboard, signature_compulsory, moderator, doctor_description_required, request_scan, request_scan_calender, request_scan_list, usg_no, can_delete_request_scan, view_wsi, share_card_wsi, add_manufacture, add_store_location, add_vendor, view_manufacture, view_vendor, view_store_location, change_inventory_min_qty, change_inventory_qty, delete_record_excel, save_inventory, delete_inventory, use_inventory, view_inventory, view_maintance, edit_inventory, can_assign_report_by_role, can_view_uploader, can_create_uploader, can_search_ref_physician, can_add_logo, can_search_institution, can_register_patient, can_view_appointment, can_view_demographic, see_report_label, edit_report_label, edit_report_type, see_report_type, "limit", view_registered_user, main_table_checkbox, main_table_status, main_table_detail, main_table_date, main_table_time, main_table_patient_name, main_table_patient_id, main_table_accession, main_table_description, main_table_gender, main_table_dob, main_table_age, "main_table_selectBtn", "main_table_viewBtn", "main_table_reportBtn", can_request_feature, can_view_request_feature, main_table_patient_select, delete_request_feature, can_transfer, generate_series, create_dataset, dataset_request, download_dataset_excel, view_dataset, view_my_dataset, copy_osimis, copy_stone, copy_download_zip, main_table_modality_view, delete_dataset, manage_report_template, send_report_dicom, manage_auto_send_ai, patient_management, view_osimis, view_radiant, "view_aiViewer", view_horos, download_report, print_report, "view_padiLabel", view_weasis, preload_osimis) FROM stdin;
patient	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-06-07 17:36:10.647+08	2026-06-07 17:36:10.647+08	f	f	f	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	t	f	f	f	f	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f
uploader	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-06-24 11:50:50.736757+08	2026-06-24 12:11:23.898+08	f	f	f	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f
user	t	t	t	t	t	t	t	t	f	t	t	t	t	t	t	2026-06-07 08:00:00+08	2026-06-28 06:52:44.227+08	f	f	f	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	f	t	t	t	f	f	f	t	f	f	f	f	f	f	f	t	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	f	f	f	t	f	f	t	t	t	t	f	f	f	f	t	f	t	t	t	t	t	t	f	f	f	t	t	f	f	f	t	f	f	f	f	f	t	t	t	t	f	f	f	f	f
guest	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-06-07 17:36:10.512+08	2026-08-09 23:58:58.262+08	f	f	f	t	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f
admin	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-06-07 08:00:00+08	2026-08-10 00:01:06.046+08	f	t	t	t	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	\N	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
IR	t	t	t	t	f	f	f	f	f	t	f	t	f	f	f	2026-08-09 09:38:05.514+08	2026-08-11 12:49:04.042+08	f	t	t	f	f	f	f	t	f	t	f	t	f	f	f	f	t	t	t	t	t	t	t	f	f	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f	f	f	20	f	t	t	t	t	t	t	t	t	t	f	f	f	t	t	t	f	f	t	f	t	t	f	f	f	f	f	t	t	t	t	f	t	t	t	f	t	t	t	t	t	t	t	f	t
\.


--
-- PostgreSQL database dump complete
--

