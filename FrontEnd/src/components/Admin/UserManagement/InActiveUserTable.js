import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell, SelectCell } from "../../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import apis from "../../../services/apis";


export default function InActiveUserTable({
    users, onUserUpdate, toggle, setDelete
}
) {
    const columns = useMemo(() => [
        {
            accessor: 'id',
            hidden: true
        }, {
            accessor: 'username',
            Header: 'Username',
            sort: true,
        }, {
            accessor: 'firstname',
            Header: 'First name',
            sort: true,

        }, {
            accessor: 'lastname',
            Header: 'Last name',
            sort: true,

        }, {
            accessor: 'email',
            Header: 'E-Mail',
            sort: true,

        },
        {
            accessor: 'phone',
            Header: 'Phone',
            sort: true,
            Cell: InputCell
        },
        {
            accessor: 'practicing_no',
            Header: 'Practicing Number',
            sort: true,
            Cell: InputCell
        },
        {
            accessor: 'place',
            Header: 'Place Of Practice',
            sort: true,
            Cell: InputCell
        },
        {
            accessor: 'department',
            Header: 'Department',
            sort: true,
            Cell: InputCell

        },
        {
            accessor: "accepted_toc",
            Header: "Accepted TOC",
            Cell: ({row})=>(row.values.accepted_toc?<p className="text-success text-center">Yes</p>:<p className='text-danger text-center'>No</p>),
          },
        {
            id: 'activate',
            Header: 'Activate',
            editable: false,
            Cell: ({ row }) => {
                return <button type='button' name='edit' className='otjs-button otjs-button-green' onClick={() => {
                    // console.log(row);
                    toggle(row?.values?.username)
                }}>Activate</button>
            }
        }, {
            id: 'delete',
            Header: 'Delete',
            editable: false,
            Cell: ({ row }) => {
                return <button type='button' name='delete' className='otjs-button otjs-button-red'
                    onClick={() => setDelete(row.values.username, row.values.userId)}>Delete</button>
            }
        }
    ], [toggle, setDelete]);

    const data = useMemo(() => users, [users]);
    return <CommonTable tableData={data} columns={columns} onDataChange={onUserUpdate} pagination={true} />
}