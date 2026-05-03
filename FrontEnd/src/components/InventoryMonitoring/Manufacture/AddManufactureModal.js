import { useState } from "react";
import { toast } from "react-toastify";
const AddManufactureModal = ({fetchData,setShowModal}) => {
  const [data,setData]=useState({});
  const handleChange=(e)=>setData(prev=>({...prev,[e.target.name]:e.target.value}))
  
  const handleSubmit=(e)=>{
    e.preventDefault();
    fetch('/api/inventory/create-manufacture',{
      method:'post',
      body:JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    }).then(res=>{
      toast.success('manufacture saved !!')
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
      <form className="px-5 py-4 rounded" onSubmit={handleSubmit} style={{background:'#fff',width:'100%',maxWidth:400,}}>
      <h5 class="text-center mb-3">Add New Manufacture</h5>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="form-control"
              value={data.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <textarea
              type="text"
              name="address"
              id="address"
              className="form-control"
              value={data.address}
              onChange={handleChange}
            >
            </textarea>
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="phone" className="form-label">
             Phone No.
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              className="form-control"
              value={data.phone}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="ssm" className="form-label">
              SSM
            </label>
            <input
              type="text"
              name="ssm"
              id="ssm"
              className="form-control"
              value={data.ssm}
              onChange={handleChange}
            />
          </div>

          <section className="d-flex justify-content-between w-100 mt-3">
          <button className=" btn otjs-button otjs-button-blue" >Save</button>
          <button type="button" onClick={()=>setShowModal(false)} className=" btn otjs-button otjs-btn-tools-red" >Cancel</button>
        </section>
      </form>
    </div>
  );
};

export default AddManufactureModal;
