import React, { useState } from "react";
import DatasetList from "./DatasetList";
import ViewDataset from "../ViewDataset";
import DatasetAnalytics from "./Analytics";

const MyDatasetTab = ({  }) => {
const [mode, setMode] = useState("list");
const [selectedDataset, setSelectedDataset] = useState(null);
const showList = () => {
    setMode("list");
}

return(
    <div>
        {mode==="list" && <DatasetList url={"/api/dataverse/my-dataset"} allowEdit={true} setSelected={setSelectedDataset} setMode={setMode}/>}
        {mode==="detail" && (<>
        <ViewDataset disablePurchase={true} disable id={selectedDataset} goBack={showList}/>
        <DatasetAnalytics id={selectedDataset}/>
        </>)}
        {mode==="edit" && <ViewDataset id={selectedDataset} goBack={showList} edit={true}/>}
    </div>
)
}

export default MyDatasetTab;