import React, { useMemo } from "react";
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";


const ListPatients = ({data=[],setEditData,setDeleteData}) => {
  const columns = useMemo(() => [
    {  Header: 'ID',
       accessor: 'id',
       show: false,
    },
    {
      Header: "Patient Name",
      accessor: "name",
      sort: true,
    },
    {
      Header: "Patient ID",
      accessor: "patient_id",
      sort: true,
    },
    {
      Header: "Email",
      accessor: "email",
      sort: true,
    },
    {
      Header: "Phone",
      accessor: "phone",
      sort: true,
    },
    {
      Header: "Edit",
      Cell: ({ row }) => (
        <button 
          className="otjs-button otjs-button-blue"
        onClick={()=>{
          setEditData(row.original);
        }}>Edit</button>
      )
    },
    {
        Header: "Delete",
        Cell: ({ row }) => (
            <button className="otjs-button otjs-button-red" onClick={()=>setDeleteData(row.original)}>Delete</button>
        )
    }
  ], []);

  const dataTable = useMemo(() => data, [data]);
  return (
    <>
      <CommonTable 
        columns={columns} 
        tableData={dataTable} />
    </>
  );
}
export default ListPatients;