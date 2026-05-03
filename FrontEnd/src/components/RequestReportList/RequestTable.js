import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import ActionBoutonView from "../CommonComponents/RessourcesDisplay/ActionButtonView";
import ActionButtonReport from "../CommonComponents/RessourcesDisplay/ActionButtonReport";

export default function RequestTable({
  users,
  onUserUpdate,
  toggle,
  setDelete,
  updateStatus,
  deleteRequest,
}) {
  const roles = useSelector((state) => state?.PadiMedical?.roles);
  const columns = useMemo(
    () => [
      {
        accessor: "No",
        Header: "No",
      },
      {
        accessor: "study_id",
        show: false,
      },
      {
        accessor: "StudyInstanceUID",
        show: false,
      },
      {
        accessor: "patient_name",
        Header: "Patient Name",
        sort: true,
      },
      {
        accessor: "patient_id",
        Header: "ID",
        sort: true,
      },
      {
        Header: "Accesion",
        accessor: "accessor",
      },
      {
        accessor: "createdAt",
        Header: "Request Date",
        sort: true,
      },
      {
        accessor: "study_type",
        Header: "Study Type",
        sort: true,
      },
      {
        accessor: "study_date",
        Header: "Study Date",
      },
      {
        accessor: "request_type",
        Header: "Request Type",
        sort: true,
      },
      {
        accessor: "req_by",
        Header: "Request By",
        sort: true,
      },
      {
        accessor: "text",
        Header: "Indication",
        sort: true,
      },

      {
        accessor: "department",
        Header: "Department",
        sort: true,
      },
      {
        accessor: "radiologist_email",
        Header: "Radiologist Email",
        sort: true,
      },
      {
        accessor: "status",
        Header: "Status",
        sort: true,
        show: roles?.can_change_report_status,
        Cell: ({ row }) => {
          return (
            <select
              style={{ minWidth: 100 }}
              onChange={(e) =>
                updateStatus(row.values.study_id, e.target.value)
              }
              className="form-control"
            >
              <option selected={row.values.status === "request" ? true : false}>
                requested
              </option>
              <option selected={row.values.status === "done" ? true : false}>
                done
              </option>
            </select>
          );
        },
      },
      {
        accessor: "reporter",
        Header: "Reporter",
        sort: true,
        show: roles?.can_change_report_status,
      },
      {
        id: "view",
        Header: "View",
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionBoutonView
              //tukar link - osimis viewer
              StudyInstanceUID={row.values.StudyInstanceUID}
              wsi_link={
                "https://strokesvr.padimedical.com/wsi/app/index.html?series=" +
                row.values.study_id  //For rishab to adds on - add SeriesOrthancID
              }
              osimis_link={
                "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
                row.values.study_id
              }
              OhifLink={"/viewer-ohif/viewer/" + row.values.StudyInstanceUID}
              radiant={
                "radiant://?n=pstv&v=0020000D&v=%22" +
                row.values.StudyInstanceUID
              }
              osirix={
                "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
                row.values.study_id +
                "/archive"
              }
              downloadzip={
                "https://strokesvr.padimedical.com/studies/" +
                row.values.study_id +
                "/archive"
              }
            />
          );
        },
      },
      {
        id: "report",
        Header: "Report",
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionButtonReport
              pid={row.values.patient_id}
              pname={row.values.patient_name}
              accessor={row.values.accessor}
              StudyInstanceUID={row.values.StudyInstanceUID}
              description={{
                StudyDescription: row.values.study_type,
                StudyDate: row.values.study_date,
              }}
              createOrviewLink={"/report/create/" + row.values.study_id}
              viewLink={"/report/view/" + row.values.study_id}
              requestLink={"/report/request/" + row.values.study_id}
              addendun={"/report/addendun/" + row.values.study_id}
              reqAdvImagin={
                "/report/request-advance-imagin/" + row.values.study_id
              }
            />
          );
        },
      },
      {
        id: "delete",
        Header: "Delete",
        show: roles?.delete_req_report,
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => deleteRequest(row.values.study_id)}
            >
              Delete
            </button>
          );
        },
      },
    ],
    [toggle, setDelete]
  );

  const data = useMemo(() => users, [users]);
  return (
    <CommonTable
      tableData={data}
      columns={columns}
      onDataChange={onUserUpdate}
      pagination={true}
    />
  );
}
