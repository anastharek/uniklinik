import DatasetList from "./DatasetList"

const DatasetRequests = () => {
    return(
        <DatasetList url={"/api/dataverse/request"} showStatus={true} disableView={true}/>
    )
}    

export default DatasetRequests;