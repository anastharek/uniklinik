import { useState } from "react";
import CreateTemplate from "./Create";
import EditTemplate from "./Edit";
import ReportTemplateTable from "./ReportTemplateTable";
const ReportTemplate=()=>{
    const [mode, setMode] = useState("view");
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    return(
        <>
        {mode=='create' && <CreateTemplate setMode={setMode}/>}
        {mode=='edit' && <EditTemplate setMode={setMode} selectedTemplate={selectedTemplate}/>}
        {mode=='view' && 
        <>
        <div className="my-4 d-flex justify-content-end"> 
            <button onClick={()=>setMode('create')} 
            className="btn btn otjs-button otjs-button-blue  w-auto ">Create Template</button>
        </div>
        <ReportTemplateTable setMode={setMode} setSelectedTemplate={setSelectedTemplate}/>
        </>
        }
       </>
    )

}

export default ReportTemplate;