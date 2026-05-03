import { useState } from "react";
import { toast } from "react-toastify";
const AddLocationModal = ({setShowModal,fetchData}) => {
  const [data,setData]=useState({});
  const handleChange=(e)=>setData(prev=>({...prev,[e.target.name]:e.target.value}))
  
  const handleSubmit=(e)=>{
    e.preventDefault();
    fetch('/api/inventory/create-location',{
      method:'post',
      body:JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })  
    .then(res=>{
      toast.success('store location saved !!')
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
      <h5 class="text-center mb-3">Add New Location</h5>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              className="form-control"
              required
              value={data.location}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Description
            </label>
            <input
              type="text"
              name="description"
              id="description"
              className="form-control"
              required
              value={data.description}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Section
            </label>
            <input
              type="text"
              name="section"
              id="section"
              className="form-control"
              required
              value={data.section}
              onChange={handleChange}
            />
          </div>
          
          <section className="d-flex justify-content-between w-100 mt-3">
          <button  className=" btn otjs-button otjs-button-blue" >Save</button>
          <button type="button" onClick={()=>setShowModal(false)} className=" btn otjs-button otjs-btn-tools-red" >Cancel</button>
        </section>
      </form>
    </div>
  );
};

export default AddLocationModal;
