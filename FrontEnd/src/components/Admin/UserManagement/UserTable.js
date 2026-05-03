import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import {
  InputCell,
  SelectCell,
} from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import apis from "../../../services/apis";
import { Link } from "react-router-dom";

export default function UserTable({
  users,
  onUserUpdate,
  modify,
  setDelete,
  toggle,
}) {
  const columns = useMemo(
    () => [
      {
        accessor: "id",
        hidden: true,
      },
      {
        accessor: "username",
        Header: "Username",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "firstname",
        Header: "First name",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "lastname",
        Header: "Last name",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "email",
        Header: "E-Mail",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "phone",
        Header: "Phone",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "practicing_no",
        Header: "Practicing Number",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "place",
        Header: "Place Of Practice",
        sort: true,
        Cell: InputCell,
      },
      {
        accessor: "role",
        Header: "Role",
        sort: true,
        options: () =>
          apis.role
            .getRoles()
            .then((res) =>
              res.map((role) => ({ value: role.name, label: role.name }))
            ),
        Cell: SelectCell,
      },
      {
        accessor: "accepted_toc",
        Header: "Accepted TOC",
        Cell: ({row})=>(row.values.accepted_toc?<p className="text-success text-center">Yes</p>:<p className='text-danger text-center'>No</p>),
      },
      {
        accessor: "password",
        Header: "New Password",
        type: "password",
        Cell: InputCell,
      },
      {
        accessor: "department",
        Header: "Department",
        Cell: InputCell,
      },
      {
        accessor: "superAdmin",
        Header: "Super Admin",
        options: async () => [
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ],
        Cell: SelectCell,
      },
      {
        id: "view",
        Header: "View Profile",
        editable: false,
        Cell: ({ row }) => {
          return (
            <Link
              style={{ textDecoration: "none" }}
              to={"/doctor-profile/" + row.values.username}
            >
              <button
                type="button"
                name="edit"
                className="otjs-button otjs-button-green"
              >
                View
              </button>
            </Link>
          );
        },
      },
      {
        id: "edit",
        Header: "Edit",
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="edit"
              className="otjs-button otjs-button-green"
              onClick={() => {
                modify(row.values);
              }}
            >
              Save
            </button>
          );
        },
      },
      {
        id: "deactivate",
        Header: "DeActivate",
        editable: false,
        Cell: ({ row }) => {
          return (
            <button
              type="button"
              name="delete"
              className="otjs-button otjs-button-red"
              onClick={() => toggle(row.values.username)}
            >
              DeActivate
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
              onClick={() => setDelete(row.values.username, row.values.userId)}
            >
              Delete
            </button>
          );
        },
      },
    ],
    [modify, setDelete]
  );

  const data = useMemo(() => users, [users]);
  return (
    <CommonTable
      tableData={data}
      columns={columns}
      onDataChange={onUserUpdate}
      pagination={true}
    />
  );
}
