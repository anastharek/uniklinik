import React, { useState } from "react";
import DatasetList from "./DatasetList";
import ViewDataset from "../ViewDataset";

const SubscribeDataset = ({  }) => {
const [mode, setMode] = useState("list");
const [selectedDataset, setSelectedDataset] = useState(null);
const showList = () => {
    setMode("list");
}

return(
    <div>
        {mode==="list" && <DatasetList url="/api/dataverse/subscribe" setSelected={setSelectedDataset} setMode={setMode}/>}
        {mode==="detail" && <ViewDataset id={selectedDataset} goBack={showList}/>}
    </div>
)
}

export default SubscribeDataset;