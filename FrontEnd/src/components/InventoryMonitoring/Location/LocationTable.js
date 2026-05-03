import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";


export default function LocationTable({locations=[],saveModal ,changeHandler,setDeletedId}) {
  const columns = useMemo(
    () => [
      {
        id:'id',
        accessor:'id',
        show:false,
      },
      {
        accessor: "location",
        Header: "Location",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "description",
        Header: "Description",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "section",
        Header: "Section",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        id: "save",
        Header: "Save",
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-green"
              onClick={() => saveModal(row.values.id)}
            >
              Save
            </button>
          );
        },
      },
      {
        id: "delete",
        Header: "Delete",
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => setDeletedId(row.values)}
            >
              Remove
            </button>
          );
        },
      },
    ],
    [saveModal]
  );

  const data = useMemo(
    () =>
    locations.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [locations]
  );
  return <CommonTable onDataChange={changeHandler} tableData={data} columns={columns}  pagination={true} />;
}
