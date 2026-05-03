import { toast } from "react-toastify";
import apis from "../../../services/apis";
import { useEffect,useState } from "react";

const EditTemplate=({setMode,selectedTemplate})=>{
     const [data,setData]=useState({
            name:"",
            text:"",
     });


     useEffect(()=>{
          fetchData();
      },[selectedTemplate]);


     const fetchData=()=>{
           //fetch data from api and set to data
           apis.reportTemplate.get(selectedTemplate)
           .then(data=>{
               setData({
                    name:data.name,
                    text:data.text
               });
           }).catch(err=>{
               toast.error("Something went wrong");
           })
      }

     const handleChange=(e)=>{
          setData({
               ...data,
               [e.target.name]:e.target.value
          });
     }

     const handleSubmit=(e)=>{
          e.preventDefault();
          //update data to api
          apis.reportTemplate.update(selectedTemplate,data)
          .then(res=>{
               toast.success("Template Updated Successfully");
          }).catch(err=>{
               toast.error("Something went wrong");
          }).finally(()=>{
               setMode('view');
          })
     }
    return(
        <div className="container mt-5">
           <h4 class="text-center">Edit Report Template</h4>
           <form onSubmit={handleSubmit} className="row mt-5">
                <div className="col-6">
                     <div className="form-group">
                          <label>Topic </label>
                          <input type="text" name="name" value={data.name} onChange={handleChange} className="form-control mt-1" placeholder="Enter Template Name" required/>
                     </div>
                </div>
                <div className="col-12 mt-4">
                     <div className="form-group">
                          <label>Template Description</label>
                          <textarea rows="20" name="text" value={data.text} onChange={handleChange} type="text" className="form-control mt-1" placeholder="Enter Template Description" required/>
                     </div>
                </div>
                <div className="col-12 mt-4 d-flex justify-content-between">
                     <button type="button" onClick={()=>setMode('view')} className="btn btn otjs-button otjs-button-red  w-auto ">Cancel</button>
                     <button type="submit" className="btn btn otjs-button otjs-button-blue  w-auto ">Update</button>
                </div>
        </form>
        </div>
    )
}

export default EditTemplate;