import { toast } from "react-toastify";
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

export default function RequestScanTable({
  data,
  onUserUpdate,
  deleteScan
}) {
  const {roles}=useSelector(state=>state.PadiMedical)
  const openImage = (base64) => {
    var image = new Image();
    image.src = base64;
    image.height = 2000;
    var w = window.open("");
    w.document.write(image.outerHTML);
  };




  const columns = useMemo(
    () => [
      {
        accessor: "id",
        show:false,
      },
      {
        accessor: "No",
        Header: "No",
        Cell: ({ row }) => {
          return row.id;
        },
      },
      {
        accessor: "patient_name",
        Header: "Patient Name",
        sort: true,
      },
      {
        accessor: "patient_id",
        Header: "Patient ID",
      },
      {
        accessor: "phone",
        Header: "Phone Number",
      },
      {
        accessor: "clinic_name",
        Header: "Clinic Name",
      },
      {
        accessor: "modality",
        Header: "Modality",
      },
      {
        Header: "Indication",
        accessor: "indication",
      },

      {
        accessor: "study_description",
        Header: "Study Description",
        sort: true,
      },
      {
        accessor: "createdAt",
        Header: "Request Date",
        Cell: ({ row }) => {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // get the user's timezone
          return new Date(row.values.date).toLocaleDateString("en-US", {
            timeZone,
          });
        },
        sort: true,
      },
      {
        accessor: "req_by",
        Header: "Requested By",
        sort: true,
      },
      {
        accessor: "doctors",
        Header: "Doctor Incharge",
        sort: true,
      },
      {
        accessor: "image",
        Header: "Image",
        Cell: ({ row }) => {
          return (
            <>
              <button
                onClick={() => openImage(row.values.image)}
                className="btn otjs-button otjs-button-blue"
                disabled={!row.values.image}
              >
                View
              </button>
            </>
          );
        },
      },
      {
        accessor: "date",
        Header: "Booking Date",
        Cell: ({ row }) => {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          return new Date(row.values.date).toLocaleDateString("en-US", {
            timeZone,
          });
        },
      },
     {
      accessor: "delete",
      Header: "Delete",
      show:roles.can_delete_request_scan,
      Cell: ({ row }) => {
        return (
          <>
            <button
              type="button"
              onClick={() => deleteScan(row.values.id)}
              className="btn otjs-button btn-danger"
            >
              Delete
            </button>
          </>
        );
      },
      }
    ],
    []
  );

  return (
    <CommonTable
      tableData={data}
      columns={columns}
      onDataChange={onUserUpdate}
      pagination={true}
    />
  );
}
