import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";


export default function ManufactureTable({manufacture=[],saveModal ,changeHandler,setDeletedId}) {
  const columns = useMemo(
    () => [
      {
        id:'id',
        accessor:'id',
        show:false,
      },
      {
        accessor: "name",
        Header: "Name",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        Header: "Address",
        accessor: "address",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "phone",
        Header: "Phone No",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "ssm",
        Header: "SSM",
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
      manufacture.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [manufacture]
  );
  return <CommonTable
  onDataChange={changeHandler}
  tableData={data} columns={columns}  pagination={true} />;
}
