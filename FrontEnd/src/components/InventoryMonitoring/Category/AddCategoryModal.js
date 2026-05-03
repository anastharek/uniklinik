import { useState } from "react";
import { toast } from "react-toastify";


const AddCategoryModal = ({setShowModal,fetchData}) => {
  const [data,setData]=useState({});
  const handleChange=(e)=>setData(prev=>({...prev,[e.target.name]:e.target.value}))
  
  const handleSubmit=(e)=>{
    e.preventDefault();
    fetch('/api/inventory/create-category',{
      method:'post',
      body:JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
    .then(res=>{
      toast.success('inventory category saved !!')
      fetchData();
      setShowModal(false)
    })
  }
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000a8",
        position: "fixed",
        top: 0,
        left: 0,
        display:'flex',
        justifyContent:'center',
        alignItems:'center'
      }}
    >
      <form onSubmit={handleSubmit} className="px-5 py-4 rounded" style={{background:'#fff',width:'100%',maxWidth:400,}}>
      <h5 class="text-center mb-3">Add New Category</h5>
          <div className="col-12 mt-1">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={data.name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <section className="d-flex justify-content-between w-100 mt-3">
          <button className=" btn otjs-button otjs-button-blue" >Save</button>
          <button type="button" onClick={()=>{setShowModal(false)}} className=" btn otjs-button otjs-btn-tools-red" >Cancel</button>
        </section>
      </form>
    </div>
  );
};

export default AddCategoryModal;
