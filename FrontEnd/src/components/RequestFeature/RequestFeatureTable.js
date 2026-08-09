import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import RequestFeature from "../CommonComponents/RequestFeature";
import obj from "../Reports/LogoData";

export default function RequestFeatureTable({
  tableData,
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
        accessor: "hospital",
        Header: "Hospital",
        sort: true,
      },
    //   {
    //     Header: "Accession",
    //     accessor: "accessor",
    //   },
      {
        accessor: "createdAt",
        Header: "Request Date",
        Cell:({row})=>(<p>{moment.utc(row.values.createdAt).utcOffset(8).format('DD/MM/YYYY')}</p>),
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
        Cell:({row})=>(<p>{moment(row.values.study_date,'YYYYMMDD').format('DD/MM/YYYY')}</p>),
      },
      {
        accessor: "request_type",
        Header: "Request Type",
        sort: true,
      },

      {
        accessor: "indication",
        Header: "Indication",
        sort: false,
      },
      {
        accessor: "radiologist",
        Header: "Radiologist",
        sort: true,
      },
      {
        accessor: "requested_by",
        Header: "Request By",
        sort: true,
      },
    //   {
    //     id: "view",
    //     Header: "View",
    //     editable: false,
    //     Cell: ({ row }) => {
    //       return (
    //         <ActionBoutonView
    //           //tukar link - osimis viewer
    //           StudyInstanceUID={row.values.StudyInstanceUID}
    //           wsi_link={
    //             "https://strokesvr.padimedical.com/wsi/app/index.html?series=" +
    //             row.values.study_id  //For rishab to adds on - add SeriesOrthancID
    //           }
    //           osimis_link={
    //             "https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" +
    //             row.values.study_id
    //           }
    //           OhifLink={"/viewer-ohif/viewer/" + row.values.StudyInstanceUID}
    //           radiant={
    //             "radiant://?n=pstv&v=0020000D&v=%22" +
    //             row.values.StudyInstanceUID
    //           }
    //           osirix={
    //             "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
    //             row.values.study_id +
    //             "/archive"
    //           }
    //           downloadzip={
    //             "https://strokesvr.padimedical.com/studies/" +
    //             row.values.study_id +
    //             "/archive"
    //           }
    //         />
    //       );
    //     },
    //   },
    //   {
    //     id: "report",
    //     Header: "Report",
    //     editable: false,
    //     Cell: ({ row }) => {
    //       return (
    //         <ActionButtonReport
    //           pid={row.values.patient_id}
    //           pname={row.values.patient_name}
    //           accessor={row.values.accessor}
    //           StudyInstanceUID={row.values.StudyInstanceUID}
    //           description={{
    //             StudyDescription: row.values.study_type,
    //             StudyDate: row.values.study_date,
    //           }}
    //           createOrviewLink={"/report/create/" + row.values.study_id}
    //           viewLink={"/report/view/" + row.values.study_id}
    //           requestLink={"/report/request/" + row.values.study_id}
    //           addendun={"/report/addendun/" + row.values.study_id}
    //           reqAdvImagin={
    //             "/report/request-advance-imagin/" + row.values.study_id
    //           }
    //         />
    //       );
    //     },
    //   },
      {
        id:"view",
        Header:"View",
        Cell:({row})=>{
          return(
            <RequestFeature
              username={roles.username}
              study_id={row.values.study_id}
              className="btn otjs-button otjs-button-orange p-2"
              btnText="View"
              canDownloadpdf={true}
            />
          )
        }
      },
      {
        id: "delete",
        Header: "Delete",
        show: roles?.delete_request_feature,
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => deleteRequest(row.values)}
            >
              Delete
            </button>
          );
        },
      },
    ],
    [toggle, setDelete]
  );

  const data = useMemo(() => tableData.map((obj,index)=>({...obj,No:index+1})), [tableData]);
  return (
    <CommonTable
      tableData={data}
      columns={columns}
      onDataChange={onUserUpdate}
      pagination={true}
    />
  );
}
