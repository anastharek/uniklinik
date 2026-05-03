import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";


export default function RegisteredUserTable({data,}) {

  const columns = useMemo(
    () => [
      {
        accessor: "username",
        Header: "Username",
        sort: true,
      },
      {
        accessor: "email",
        Header: "Email",
        sort: true,
      },
      {
        Header: "Phone",
        accessor: "phone",
      },
      {
        accessor: "firstname",
        Header: "Firstname",
        sort: true,
      },
      {
        accessor: "lastname",
        Header: "Lastname",
        sort: true,
      },
      {
        accessor: "role",
        Header: "Role",
      },
      {
        accessor: "department",
        Header: "Department",
        sort: true,
      },
      {
        accessor: "practicing_no",
        Header: "Practicing No",
        sort: true,
      },
      {
        accessor: "place",
        Header: "Place",
        sort: true,
      },
      {
        accessor: "is_active",
        Header: "Active",
        sort: true,
        Cell: ({ row }) =>(<p>{row.values.is_active?"Yes":"No"}</p>)
      },
      
      {
        accessor: "accepted_toc",
        Header: "Accepted Toc",
        sort: true,
        Cell: ({ row }) =>(<p>{row.values.accepted_toc?"Yes":"No"}</p>)
      },
      
,
    ],
    []
  );

  const tableData = useMemo(() => data, [data]);
  return (
    <CommonTable
      tableData={tableData}
      columns={columns}
      onDataChange={()=>{}}
      pagination={true}
    />
  );
}
