import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell } from "../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import { useSelector } from "react-redux";

export default function InventoryTable({inventory=[] ,setQr,saveModal ,changeHandler,setDeletedId,setUsedProduct}) {
  const roles = useSelector((state) => state.PadiMedical.roles);
  const columns = useMemo(
    () => [
      {
        id:'id',
        accessor:'id',
        show:false,
      },
      {
        id: "qr",
        Header: "QR CODE",
        editable: roles.edit_inventory,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="qr"
              className={`otjs-button otjs-btn-tools-${row.values.min_qty>=row.values.unit_quantity?row.values.unit_quantity==0?'red':'orange' :'blue'}`}
              style={{width:'max-content',padding:'auto 10px'}}
              onClick={() => setQr(row.values.stock_id)}
            >
             Show QR
            </button>
          );
        },
      },
      {
        accessor: "item_code",
        Header: "Item Code",
        sort: true,
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "stock_id",
        Header: "Stock ID",
        sort: true,
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "item_name",
        Header: "Item Name",
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "item_description",
        Header: "Description",
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "InventoryCategory.name",
        Header: "Category",
      },
      {
        accessor: "type",
        Header: "Type",
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "StoreLocation.location",
        Header: "Store",
      },
      {
        accessor: "unit_quantity",
        Header: "QTY",
        editable:roles.change_inventory_qty,
        Cell:InputCell,
      },
      {
        accessor: "expiry_date",
        Header: "Expiry Date",
        editable:roles.edit_inventory,
        type:'date',
        Cell:(props)=><InputCell {...props} formatter={(value)=>new Date(value).toLocaleDateString()}/>,
      },
      {
        accessor: "cost_per_unit",
        Header: "Cost Per Unit",
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "total_cost",
        Header: "Total Cost",
        editable:roles.edit_inventory,
        Cell:InputCell,
      },
      {
        accessor: "Manufacture.name",
        Header: "Manufacture Name",
      },
      {
        accessor: "Vendor.name",
        Header: "Vendor Name",
      },
      {
        accessor: "min_qty",
        Header: "Min Remaning Qty",
        editable:roles.change_inventory_min_qty,
        Cell:InputCell,
      },
      {
        id: "use",
        Header: "Use",
        editable: false,
        show:roles.use_inventory,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              className="otjs-button otjs-button-green"
              style={{opacity:!row.values.unit_quantity?0.6:1}} 
              onClick={() => setUsedProduct(row.values)}
              disabled={!row.values.unit_quantity}
            >
             Use
            </button>
          );
        },
      },
      {
        id: "save",
        Header: "Save",
        editable: false,
        show:roles.save_inventory,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
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
        show:roles.delete_inventory,
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
    [saveModal,setUsedProduct,setUsedProduct]
  );

  const data = useMemo(
    () =>
      inventory.map((element, index) => {
        return { ...element, No: index + 1 };
      }),
    [inventory]
  );
  return <CommonTable 
           onDataChange={changeHandler}
           tableData={data} 
           columns={columns}  
           pagination={true}
          />;
}
