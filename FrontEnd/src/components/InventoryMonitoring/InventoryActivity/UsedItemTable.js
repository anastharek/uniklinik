import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import moment from "moment";

const options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};
export default function InventoryTable({inventory=[] ,setQr,saveModal ,changeHandler,setDeletedId,setUsedProduct}) {
  const columns = useMemo(
    () => [
      {
        id:'id',
        accessor:'id',
        show:false,
      },
      {
        id: "created_at",
        Header: "Create At",
        accessor: "createdAt",
        editable: false,
        Cell: ({ row }) => {
          return (
          <p>{moment.utc(row?.original?.createdAt).utcOffset(8).format('DD-MM-YYYY HH:mm:ss')}</p>
          );
        },
      },
      {
        accessor: "activity_type",
        Header: "Activity",
        sort: true,
        editable:true,
      },
      {
        accessor: "User.username",
        Header: "User",
        sort: true,
        editable:true,
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
