import moment from "moment";
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";


export default function InventoryTable({inventory=[] ,setQr,saveModal ,changeHandler,setDeletedId,setUsedProduct}) {
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
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="qr"
              className="otjs-button otjs-btn-tools-orange"
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
        editable:true,
      },
      {
        accessor: "item_name",
        Header: "Item Name",
      },
      {
        accessor: "used_by",
        Header: "Used By",
        sort: true,
      },
      {
        accessor: "user_at",
        Header: "Used At",
        Cell: ({ row }) => {
          return (
            <p>{moment.utc(row?.original?.createdAt).utcOffset(8).format('DD-MM-YYYY HH:mm:ss')}</p>
          );
        },
     
      },
      {
        accessor: "stock_id",
        Header: "Stock ID",
        sort: true,
      },
      {
        accessor: "item_description",
        Header: "Description",
        editable:true,
      },
      {
        accessor: "InventoryCategory.name",
        Header: "Category",
      },
      {
        accessor: "type",
        Header: "Type",
        editable:true,
      },
      {
        accessor: "StoreLocation.location",
        Header: "Store",
      },
      {
        accessor: "unit_quantity",
        Header: "QTY",
      },
      {
        accessor: "expiry_date",
        Header: "Expiry Date",
        Cell: ({ row }) => {
          return (
            <p>{moment(row.values.expiry_date).format('DD-MM-YYYY HH:mm:ss')}</p>
          );
        },
      },
      {
        accessor: "cost_per_unit",
        Header: "Cost Per Unit",
        editable:true,
      },
      {
        accessor: "total_cost",
        Header: "Total Cost",
        editable:true,
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
        editable:true,
      },
    ],
    [saveModal,setUsedProduct]
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
