import React, {Fragment, useMemo} from 'react'
import {toast} from 'react-toastify';
import apis from '../../../services/apis';
import CommonTable from "../../CommonComponents/RessourcesDisplay/ReactTable/CommonTable";

const ConfListTable = ({ confList, onDelete }) => {
    const columns = useMemo(() => [{
        accessor: 'id',
        show: false
    }, {
        accessor: 'name',
        Header: 'Name'
    }, {
        accessor: 'url',
        Header: 'URL'
    }, {
        accessor: 'echo',
        Header: 'Echo',
        Cell: ({row}) => {
            return (<div className="text-center">
                <input type="button" className='otjs-button otjs-button-blue' onClick={async () => {
                    try {
                        let res=await apis.aiConf.echo(row.values.url)
                        if(res.processed_images.length!=0){
                            throw new Error(row.values.name+' Echo Failure')
                        }
                        toast.success(row.values.name + ' Success')
                    } catch (error) {
                        toast.error(row.values.name + ' Echo Failure')
                    }

                }} value="Echo"/>
            </div>)
        }
    }, {
        accessor: 'remove',
        Header: 'Remove',
        Cell: ({row}) => {
            return (
                <div className="text-center">
                    <input type="button" className='otjs-button otjs-button-red' onClick={async () => {
                        try {
                            onDelete(row.values.id)
                        } catch (error) {
                            toast.error(error.statusText)
                        }
                    }} value="Remove"/>
                </div>)
        },
        formatExtraData: this
    }], [onDelete]);

    /**
     * Translate Orthanc API in array of Rows to be consumed by BootstrapTable
     */
    const data = useMemo(() => Object.entries(confList).map(([name, data]) => ({
        name,
        ...data
    })), [confList]);

    return (
        <Fragment>
            <CommonTable tableData={data} columns={columns}/>
        </Fragment>
    )

}

export default ConfListTable;