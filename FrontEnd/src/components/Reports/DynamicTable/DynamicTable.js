import { useEffect } from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import Table from 'react-smart-dynamic-table'
import classes from './App.module.scss';
import './table.css'
import './table2.css'
import './table3.css'
import { OTHER, XRAY, ULTRASOUND } from './Type';

function DynamicTable({ getData, data = "[]" }) {
    const [type, setType] = useState('table-type1');
    const [table, setTable] = useState([]);
    const [typeReport, setReportType] = useState(null)
    const dataType = { 'empty': [], 'x-ray': XRAY, 'ultra-sound': ULTRASOUND, 'other': OTHER, }


    const formated_data = useMemo(() => {
        if (!data)
            return []
        let parseData = JSON.parse(data)
        if (parseData?.data?.length > 1) {
            let finalizeData = parseData?.headers?.map((heading) => {
                let obj = { 'header': heading }
                obj['columnData'] = parseData.data.map((rowData) => {
                    return rowData[heading]
                })
                return obj
            })
            return finalizeData;
        }
        return []
    }, [data])
    const dynamicTable = useMemo(() => {
        return <Table
            id='Test'
            key={Math.random()}
            tableColumns={table.length === 0 && typeReport !== 'empty' ? formated_data : table}
            tableClasses={{
                container: classes.container,
                addRowButton: classes.addRowButton,
                sendButton: [classes.sendButton, classes.mt],
                tableHeadCell: [classes.border],
                tableBodyCeil: [classes.border]

            }}
            onSendData={getData}
        />
    }, [table, getData, formated_data, data])

    const styleChange = (e) => {
        setType(e.target.value);
    }

    const typeChange = (e) => {
        setReportType(e.target.value);
        if (e.target.value === 'default') {
            setTable(formated_data);
            return;
        }
        if (dataType[e.target.value]) {
            if (e.target.value == 'ultra-sound') {
                setType('table-type3')
            } else if (e.target.value === 'x-ray') {
                setType('table-type1')
            } else {
                setType('table-type2')
            }
            setTable(dataType[e.target.value]);
        }
    }

    return (
        <div className={`dynamic-table-wrapper  ${type}`}>
            {dynamicTable}
            <select style={{ width: 'max-content' }} className='mb-4 button-dropdown button-dropdown-orange dropdown-toggle btn btn-button-dropdown-orange' onChange={styleChange}>
                <option hidden>Select Column format</option>
                <option value={'table-type1'}>2,3 small</option>
                <option value={'table-type2'}>3rd small</option>
                <option value={'table-type3'}>all same</option>
            </select>

            <select style={{ width: 'max-content' }} className='ms-2 mb-4 button-dropdown button-dropdown-orange dropdown-toggle btn btn-button-dropdown-orange' onChange={typeChange}>
                <option hidden>Select Type</option>
                <option value={'default'}>Default</option>
                <option value={'empty'}>Empty</option>
                <option value={'x-ray'}>FOMEMA CXR</option>
                <option value={'ultra-sound'}>Doppler Scan</option>
                <option value={'other'}>Other</option>
            </select>

        </div >

    );
}

export default DynamicTable;