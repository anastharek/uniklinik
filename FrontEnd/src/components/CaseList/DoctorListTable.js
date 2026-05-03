import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import {
  InputCell,
  SelectCell,
  SelectLabels,
} from "../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import { Select } from "@material-ui/core";
import { useSelector } from "react-redux";
import ActionBoutonView from "../CommonComponents/RessourcesDisplay/ActionButtonView";
import ActionButtonReport from "../CommonComponents/RessourcesDisplay/ActionButtonReport";
import ActionBouton from "../CommonComponents/RessourcesDisplay/ActionBouton";
import { toast } from "react-toastify";
function formateDateStr(str) {
  //20220728
  if (!str) return "";
  return `${str?.slice(6)}/${str?.slice(4, 6)}/${str?.slice(0, 4)}`;
}

export default function DoctorListTable({ reports, setDelete }) {
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
        accessor: "addendumby",
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
        Cell: ({ row }) => (<p>{row?.values?.patient_name?.replaceAll('^', ' ')}</p>),
      },
      {
        accessor: "patient_id",
        Header: "ID",
        sort: true,
      },
      {
        accessor: "nric",
        Header: "NRIC",
        sort: true,
      },
      {
        Header: "Accesion",
        accessor: "accesor",
      },
      {
        accessor: "study_type",
        Header: "Study Type",
        sort: true,
      },
      {
        accessor: "RefPhysicianName",
        Header: "Referring Centre",
        sort: true,
      },
      {
        accessor: "study_date",
        Header: "Study Date",
        Cell: ({ row }) => {
          return <p>{formateDateStr(row?.values?.study_date)}</p>;
        },
      },
      {
        Header: "Status",
        accessor: "status",
        sort: true,
        Cell: ({ row }) => {
          return (
            <p>
              {row.values.addendumby === undefined ? (
                <b className="text-danger">Not Finalize</b>
              ) : (
                <b className="text-success">Finalize</b>
              )}
            </p>
          );
        },
      },
      {
        accessor: "type",
        Header: "type",
        show:roles.see_report_type,
        sort: true,
      },
      {
        accessor: "InstitutionName",
        Header: "InstitutionName",
        sort: true,
      },
      {
        accessor: "label",
        Header: "label",
        show:roles.see_report_label,
        editable:roles.edit_report_label,
        Cell:SelectLabels,
      },
      {
        accessor: "doctors",
        Header: "Doctor Incharge",
        sort: true,
        Cell: ({ row }) => {
          return <p>{row?.values?.doctors?.join(" , ")}</p>;
        },
      },
      {
        accessor: "roles",
        Header: "Role Can View",
        sort: true,
        Cell: ({ row }) => {
          return <p>{row?.values?.roles?.join(" , ")}</p>;
        },
      },
      {
        id: "select",
        Header: "Select",
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionBouton
            level="studies"
            orthancID={row.values.study_id}
            StudyInstanceUID={row.values.StudyInstanceUID}
            onDelete={()=>{}}
            row={row}
            refresh={()=>{}}
            pname={row.values.patient_name}
            pid={row.values.patient_id}
            StudyDescription={row.values.study_type}
            openLabelModal={()=>{}}
 
            />
          );
        },
      },
      {
        id: "view",
        Header: "View",
        editable: false,
        Cell: ({ row }) => {
          return (
            <ActionBoutonView
              role={roles}
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
              StudyOrthancID={row.values.study_id}
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
        show: roles.delete_report,
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => setDelete(row.values.study_id)}
            >
              Unassigned
            </button>
          );
        },
      },
      {
        id:"copy_osimis",
        Header:"Copy Osimis Link",
        show:roles.copy_osimis,
        editable:false,
        Cell:({row})=>{
          return(
            <button
              type="button"
              name="copy_osimis"
              className="otjs-button otjs-button-blue"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
                    row.values.study_id
                );
                toast.success("Link Copied");
              }}
            >
              Copy
            </button>
          )
        }
      },
      {
        id:"copy_stone",
        Header:"Copy Stone Link",
        show:roles.copy_stone,
        editable:false,
        Cell:({row})=>{
          return(
            <button
              type="button"
              name="copy_stone"
              className="otjs-button otjs-button-blue"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://strokesvr.padimedical.com/stone-webviewer/index.html?study=" +
                  row.values.StudyInstanceUID,
                );
                toast.success("Link Copied");
              }}
            >
              Copy
            </button>
          )
        }
      },
      {
        id:"Copy Download Link",
        Header:"Copy Download Link",
        show:roles.copy_download_zip,
        editable:false,
        Cell:({row})=>{
          return(
            <button
              type="button"
              name="copy_download_link"
              className="otjs-button otjs-button-blue"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://strokesvr.padimedical.com/studies/" +
                  row.values.study_id +
                  "/archive"
                );
                toast.success("Link Copied");
              }}
            >
              Copy
            </button>
          )
        }
      }
    ],
    [setDelete]
  );

  const data = useMemo(
    () =>
      reports.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [reports]
  );
  return <CommonTable tableData={data} columns={columns} pagination={true} />;
}
