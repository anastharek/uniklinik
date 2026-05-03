import CommonTable from "../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";
import React, { useMemo } from "react";
import { InputCell, SelectCell } from "../CommonComponents/RessourcesDisplay/ReactTable/EditableCells";
import { Select } from "@material-ui/core";
import { useSelector } from "react-redux";



export default function ImaginTable({
    users, onUserUpdate, toggle, setDelete, updateStatus, deleteRequest
}
) {

    const roles = useSelector(state => state?.PadiMedical?.roles)
    const columns = useMemo(() => [
        {
            accessor: 'No',
            Header: "No"

        },
        {
            accessor: 'study_id',
            show: false,

        }
        , {
            accessor: 'hospital_email',
            Header: 'Hospital Email',
            sort: true,
        }, {
            accessor: 'patient_email',
            Header: 'Patient Email',
            sort: true,

        }, {
            accessor: 'patient_name',
            Header: 'Patient Name',
            sort: true,

        }, {
            accessor: 'patient_id',
            Header: 'Patient ID',
            sort: true,

        }, {
            accessor: 'study_type',
            Header: 'Study Type',
            sort: true,

        },
        {
            accessor: 'requested_by',
            Header: 'Requested By',
            sort: true,

        },
        {
            accessor: 'request_date',
            Header: 'Requested Date'

        },
        {
            accessor: 'text',
            Header: 'Indication'

        },
        {
            id: 'delete',
            Header: 'Delete',
            show: roles?.delete_imagin,
            editable: false,
            Cell: ({ row }) => {
                return <button type='button' name='delete' className='otjs-button otjs-button-red'
                    onClick={() => deleteRequest(row.values.study_id)}>Delete</button>
            }
        }
    ], [toggle, setDelete]);

    const data = useMemo(() => users, [users]);
    return <CommonTable tableData={data} columns={columns} onDataChange={onUserUpdate} pagination={true} />
}