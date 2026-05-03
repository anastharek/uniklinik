import CommonTable from "./CommonTable";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { commonColumns, seriesColumns } from "./ColumnFactories";
import { FormCheck, Dropdown, ButtonGroup } from "react-bootstrap";
import SendAetDropdown from "../../../Export/SendAetDropdown";
import apis from "../../../../services/apis";
import CreateAiSeries from "../../../Export/CreateAiSeries";

function TableSeries({
    series,
    onDelete,
    refresh,
    hiddenActionBouton,
    hiddenRemoveRow,
    rowEvents,
    rowStyle,
    pagination
}) {
    const [showDelete, setShowDelete] = useState(true);
    const [aets,setAets]=useState([]);
    const roles = useSelector((state) => state?.PadiMedical?.roles);
    const [url,setUrl]=useState(null);
    useEffect(() => {
        //alert(window.location.pathname)
        if (window.location.pathname == '/padimedical-content') {
            setShowDelete(false)
        }
    }, [window.location.pathname])
   
    useEffect(()=>{
       apis.aiConf.get()
       .then(res=>setUrl(res?.data||[]))
       .catch(console.log)
    },[])
    useEffect(()=>{
        apis.aets.getAets()
        .then(setAets)
        .catch(console.log)
     },[])
    const columns = useMemo(() => [
        commonColumns.RAW,
        seriesColumns.ORTHANC_ID,
        seriesColumns.DESCRIPTION,
        seriesColumns.MODALITY,
        seriesColumns.SERIES_NUMBER,
        ...(!hiddenActionBouton ? [seriesColumns.ACTION(onDelete, refresh)] : []),
        {
            id:"send_to",
            Header: "Send To",
            show:roles.can_transfer,
            Cell:({row})=>{
              return (<Dropdown as={ButtonGroup} autoClose="outside" className="mt-2">
              <Dropdown.Item>
                <SendAetDropdown aets={aets} exportIds={[row.values.SeriesOrthancID]} />
              </Dropdown.Item>
            </Dropdown>)
            }
          },
          {
            id:"Generate AI Series",
            Header: "Generate AI Series",
            show:roles.generate_series,
            Cell:({row})=>{
                return (<Dropdown as={ButtonGroup}  autoClose="outside" className="mt-2">
                    <Dropdown.Item>
                      <CreateAiSeries 
                        series={[row.values.SeriesOrthancID]} 
                        urls={url} 
                        key={row.values.SeriesOrthancID}
                        studyID={row.original.StudyID[0]}
                        SeriesDescription={row.values.SeriesDescription}
                        refresh={refresh}
                        modality={row.values.Modality}
                      />
                    </Dropdown.Item>
                  </Dropdown>)
            }
          }
    ], [
        hiddenActionBouton, hiddenRemoveRow, onDelete, refresh,aets]);
    const data = useMemo(() => series.map(x => ({
        raw: { ...x },
        ...x
    })), [series]);

    //changes done by rishabh
    if (showDelete) {
        data.map((element, index) => {
            data[index]['Delete'] = <button style={{ display: 'block', margin: 'auto' }} onClick={() => onDelete(element.SeriesOrthancID)} className="btn btn-danger">Delete</button>
        });
    }

    //line 43 change done by rishabh
    return <CommonTable columns={showDelete ? [...columns, { accessor: 'Delete', Header: 'Delete', sort: false, Filter: null, filter: null }] : [...columns]} tableData={data} rowEvents={rowEvents}
        rowStyle={rowStyle} pagination={pagination} />
}

export default TableSeries;
