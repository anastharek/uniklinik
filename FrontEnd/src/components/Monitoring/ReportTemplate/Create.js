import { useState } from "react";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const CreateTemplate=({setMode})=>{

    const [data,setData]=useState({
        name:"",
        text:""
    });

    const handleChange=(e)=>{
        setData(prev=>({
           ...prev,
            [e.target.name]:e.target.value
        }))
    }

    const handleSubmit=(e)=>{
        e.preventDefault();
        apis.reportTemplate.create(data)
        .then(res=>{
            toast.success("Template Created Successfully");
        })
        .catch(err=>{
            toast.error("Something went wrong");
        }).finally(()=>{
            setData({
                name:"",
                text:""
            })
            setMode('view');
        })
    }

    return(
        <div className="container mt-5">
           <h4 class="text-center">Create Report Template</h4>
           <form onSubmit={handleSubmit} className="row mt-5">
                <div className="col-6">
                     <div className="form-group">
                          <label>Topic </label>
                          <input type="text" name="name" onChange={handleChange} className="form-control mt-1" placeholder="Enter Template Name" required/>
                     </div>
                </div>
                <div className="col-12 mt-4">
                     <div className="form-group">
                          <label>Template Description</label>
                          <textarea rows="20" name="text" onChange={handleChange} type="text" className="form-control mt-1" placeholder="Enter Template Description" required/>
                     </div>
                </div>
                <div className="col-12 mt-4 d-flex justify-content-between">
                     <button type="button" onClick={()=>setMode('view')}  className="btn btn otjs-button otjs-button-red  w-auto ">Cancel</button>
                     <button type="submit" className="btn btn otjs-button otjs-button-blue  w-auto ">Save</button>
                </div>
        </form>
        </div>
    )
}

export default CreateTemplate;