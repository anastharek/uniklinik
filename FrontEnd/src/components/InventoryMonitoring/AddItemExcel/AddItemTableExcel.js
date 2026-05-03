import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import { useSelector } from "react-redux";

export default function AddItemTableExcel({inventory=[] ,setDeletedId ,changeHandler}) {
  const roles = useSelector((state) => state.PadiMedical.roles);
  const columns = useMemo(
    () => [
      {
        accessor: "Item Code",
        Header: "Item Code",
        sort: true,
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Item Name",
        Header: "Item Name",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Description",
        Header: "Description",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Category",
        Header: "Category",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Type",
        Header: "Type",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Store",
        Header: "Store",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "QTY",
        Header: "QTY",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Expiry Date",
        Header: "Expiry Date",
        editable:true,
        type:'date',
        Cell:InputCell,
      },
      {
        accessor: "Cost Per Unit",
        Header: "Cost Per Unit",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Total Cost",
        Header: "Total Cost",
        editable:true,
        Cell:InputCell,
      },
      {
        accessor: "Manufacture Name",
        Header: "Manufacture Name",
        Cell:InputCell,
      },
      {
        accessor: "Vendor Name",
        Header: "Vendor Name",
        Cell:InputCell,
      },
      {
        accessor: "Min Remaning Qty",
        Header: "Min Remaning Qty",
        editable:true,
        Cell:InputCell,
      },
      {
        id: "delete",
        Header: "Delete",
        editable: false,
        show:roles.delete_record_excel,
        Cell: ({ row }) => {

          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => setDeletedId(row.index)}
            >
              Remove
            </button>
          );
        },
      },
    ],
    []
  );

  const data = useMemo(
    () =>
      inventory.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [inventory]
  );
  return <CommonTable  onDataChange={changeHandler} tableData={data} columns={columns}  pagination={true} />;
}
