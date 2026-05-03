import React, { useMemo } from "react";
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";

const ListPadilabels = ({ data = [], setEditData, setDeleteData }) => {
    const columns = useMemo(() => [
        {
            Header: 'ID',
            accessor: 'id',
            show: false,
        },
        {
            Header: "Label",
            accessor: "label",
            sort: true,
        },
        {
            Header: "Path",
            accessor: "path",
            sort: true,
        },
        {
            Header: "URL",
            accessor: "url",
            sort: true,
        },
        {
            Header: "Roles",
            accessor: "roles",
            Cell: ({ value }) => (
                <span>{Array.isArray(value) ? value.join(", ") : ""}</span>
            ),
            sort: false,
        },
        {
            Header: "Edit",
            Cell: ({ row }) => (
                <button
                    className="otjs-button otjs-button-blue"
                    onClick={() => {
                        setEditData(row.original);
                    }}
                >
                    Edit
                </button>
            )
        },
        {
            Header: "Delete",
            Cell: ({ row }) => (
                <button
                    className="otjs-button otjs-button-red"
                    onClick={() => setDeleteData(row.original)}
                >
                    Delete
                </button>
            )
        }
    ], [setEditData, setDeleteData]);

    const dataTable = useMemo(() => data, [data]);

    return (
        <>
            <CommonTable
                columns={columns}
                tableData={dataTable} />
        </>
    );
}

export default ListPadilabels;
