import axios from "axios";
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo,useState } from "react";
import { toast } from "react-toastify";

const UpdateStatus = ({row,refresh}) => {
  const [status, setStatus] = useState(row.original.status);

  const handleChange = async(e) => {
    setStatus(e.target.value);
    if(e.target.value=="accepted"){
     await axios.post('/api/dataverse/accept-request',{request_id:row.original.id})
      .then(res=>toast.success("Request accepted"))
      .catch(err=>toast.error(err.response.data.errorMessage))
    }else if(e.target.value=="rejected"){
     await axios.post('/api/dataverse/reject-request',{request_id:row.original.id})
      .then(res=>toast.success("Request rejected"))
      .catch(err=>toast.error(err.response.data.errorMessage))
    }
    refresh();
  }
  return (
    <select onChange={handleChange} style={{width:120}} name="status" value={status} className="form-select">
      <option hidden selected={status=="pending"} value="pending">Pending</option>
      <option selected={status=="accepted"} value="accepted">Accepted</option>
      <option selected={status=="rejected"} value="rejected">Rejected</option>
    </select>
  )
}

export default function DatasetRequestTable({data,refresh}) {

  const columns = useMemo(
    () => [
      {
        Header: "Status",
        Cell:({row})=><UpdateStatus refresh={refresh} row={row}/>,
      },
      {
        accessor: "email",
        Header: "Form.Email",
        sort: true,
      },
      {
        accessor: "phone",
        Header: "Form.Phone",
        sort: true,
      },
      {
        accessor: "name",
        Header: "Form.Name",
      },
      {
        accessor: "Dataset.name",
        Header: "Dataset.Name",
        sort: true,
      },
      {
        accessor: "dataset link",
        Header: "Dataset.Link",
        sort: true,
      },
      {
        accessor: "Dataset.User.username",
        Header: "Owner.Username",
      },
      {
        accessor: "Dataset.User.email",
        Header: "Owner.Email",
        sort: true,
      },
      {
        accessor: "Dataset.User.phone",
        Header: "Owner.Phone",
        sort: true,
      },
      {
        accessor: "User.username",
        Header: "User.Username",
        sort: true,
      },
      {
        accessor: "User.email",
        Header: "User.Email",
        sort: true,
      },
      {
        accessor: "User.phone",
        Header: "User.Phone",
        sort: true,
      },
      {
        accessor: "createdAt",
        Header: "CreatedAt",
        sort: true,
        Cell: ({ row }) =>(<p>{}</p>)
      }
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
