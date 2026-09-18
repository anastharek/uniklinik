import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import ActionBoutonView from "../CommonComponents/RessourcesDisplay/ActionButtonView";
import ActionButtonReport from "../CommonComponents/RessourcesDisplay/ActionButtonReport";
import moment from "moment";

export default function AdminCaseListTable({ tableData=[]  }) {
  const roles = useSelector((state) => state?.PadiMedical?.roles);

  const columns = useMemo(
    () => [
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
        accessor: "No",
        Header: "No",
      },
      {
        accessor: "study_date",
        Header: "Study Date",
        Cell: ({row}) => moment(row.original.study_date,'YYYYMMDD').format("DD/MM/YYYY"),
        sort: true,
      },
      {
        accessor: "study_type",
        Header: "Study Type",
        sort: true,
        Cell: ({ row }) => row.original.study_type || ""
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
                     "https://uniklinikosimis.anzverse.com/osimis-viewer/app/index.html?study=" +
                     row.values.study_id
                   }
                   OhifLink={"/viewer-ohif/viewer/dicomweb?StudyInstanceUIDs=" + row.values.StudyInstanceUID}
                   radiant={
                     "radiant://?n=pstv&v=0020000D&v=%22" +
                     row.values.StudyInstanceUID
                   }
                   osirix={
                     "osirix://?methodName=downloadURL&URL=https://strokesvr.padimedical.com/studies/" +
                     row.values.study_id +
                     "/archive"
                   }
                   weasis={
                     "weasis://?studyUID=" + row.values.StudyInstanceUID
                   }
                   downloadzip={
                     "/api/studies/" +
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
                   StudyOrthancID={row.values.study_id}
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
    ],
    []
  );

  const data = useMemo(
    () =>
      tableData.map((element, index) => {
        return { ...element, No: index + 1};
      }),
    [tableData]
  );

  return <CommonTable tableData={data} onDataChange={()=>{}} columns={columns} pagination={true} />;
}
