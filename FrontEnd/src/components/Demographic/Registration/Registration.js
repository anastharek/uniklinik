import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Registration = () => {
  const [data,setData]=useState({});
  const [fetchingUser,setFetchingUser]=useState(false);
  const [suggestion,setSuggestion]=useState([]);

  useEffect(()=>{
    if(!data.patient_id) {
      setFetchingUser(false);
      return
    }
    if(timer){
      clearTimeout(timer);
      setFetchingUser(false)
    }
    setFetchingUser(true)
    
    var timer=setTimeout(()=>{
      
      axios.get(`/api/demographic/patient/${data.patient_id}`)
      .then(res=>{
        if(res.data?.patient){
          setData({
            ...res.data?.patient,
            creatinine:null,
            patient_type:null,
            clinical_summary:null,


          })
        }
        
      })
      .catch(err=>console.log(err))
      .finally(()=>setFetchingUser(false))
    },500)
    return ()=>clearTimeout(timer);
  },[data.patient_id])
  
  //fetching users by name
  useEffect(()=>{
    if(!data.name){
      setSuggestion([])
      return
    };
    if(fetchByNameTime){clearTimeout(fetchByNameTime);}
    var fetchByNameTime=setTimeout(()=>{
      axios.get(`/api/demographic/patient/suggest/${data.name}`)
      .then(res=>setSuggestion(res.data.patient))
      .catch(()=>{})
    },500)
    return ()=>clearTimeout(fetchByNameTime);
  },[data.name])

  const handleChange=(e)=>setData(prev=>({...prev,[e.target.name]:e.target.value}));
  
  const handlePost=(e)=>{
    e.preventDefault();
    let appointment_datetime=new Date(data.appointment_date);
    appointment_datetime.setHours(data.appointment_time.split(':')[0])
    appointment_datetime.setMinutes(data.appointment_time.split(':')[1])
    axios.post('/api/demographic/register',{
      ...data,
     appointment_datetime
    })
    .then(res=>{
      setData(prev=>({...prev,accesion_number:res.data.appointment.accesion_number}))
      setTimeout(()=>{
        setData({});
      },3000)
      toast.success('appointment schedule !!')
    })
    .catch(err=>{
      if(err?.response?.data?.errorMessage){
        toast.error(err?.response?.data?.errorMessage)
      }
    })
  }
  


  return (
    <>
    <h4 class="text-center mb-4">Registration</h4>
      <form  onSubmit={handlePost}>
      <div className="row">
      <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Patient ID <span style={{opacity:fetchingUser?1:0,transition:'1s all ease-out'}}>(Getting user info ...)</span>  
          </label>
          <input
            type="text"
            name="patient_id"
            className="form-control"
            value={data.patient_id||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Name
          </label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={data.name||''}
            onChange={handleChange}
            required
          />
         {(suggestion.length)?
         <select className="form-select mt-2" onChange={(e)=>setData(prev=>({...prev,patient_id:e.target.value}))}>
          <option value='' hidden>Select From suggestion</option>
          {suggestion.map(({name,patient_id})=><option value={patient_id}>{name}</option>)}
          </select>:null } 
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Gender
          </label>
          <select
            name="gender"
            className="form-select"
            value={data.gender||''}
            onChange={handleChange}
            required
          >
            <option value='' hidden>Select Gender</option>
            <option value={'Male'}>Male</option>
            <option value={'Female'}>Female</option>
            <option  value={'Others'}>Others</option>
            </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            DOB
          </label>
          <input
            type="date"
            name="dob"
            className="form-control"
            value={data.dob||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Age
          </label>
          <input
            type="number"
            name="age"
            className="form-control"
            value={data.age||''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           NRIC
          </label>
          <input
            type="text"
            name="nric"
            className="form-control"
            value={data.nric||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Phone
          </label>
          <input
            type="text"
            name="phone"
            className="form-control"
            value={data.phone||''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Allergic
          </label>
          <select className="form-select" name="allergic" value={data.allergic||''} onChange={handleChange} required>
            <option value='' hidden>Select option</option>
            <option value='yes'>Yes</option>
            <option value='no'>No</option>
          </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Asthma
          </label>
          <select className="form-select" name="asthma" value={data.asthma||''} onChange={handleChange} required>
          <option value='' hidden>Select option</option>
            <option value='yes'>Yes</option>
            <option value='no'>No</option>
          </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Creatinine
          </label>
          <input
            type="text"
            name="creatinine"
            className="form-control"
            value={data.creatinine||''}
            onChange={handleChange}
            
          />
        </div>
      </div>
      <p className="h5 mt-4">Request scan details</p>
      <div className="row">
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Modality Type
          </label>
          <select className="form-select" name="modality_type" value={data.modality_type||''} onChange={handleChange} required>
          <option value='' hidden>Select option</option>
            <option value='XA'>XA</option>
            <option value='CT'>CT</option>
            <option value='MRI'>MRI</option>
            <option value='US'>US</option>
            <option value='XR'>XR</option>
          </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Scan Region
          </label>
          <input className="form-control" name="scan_region" value={data.scan_region||''} onChange={handleChange} required/>       
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Referring Physician
          </label>
          <input
            type="text"
            name="ref_physician"
            className="form-control"
            value={data.ref_physician||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Request Department
          </label>
          <input
            type="text"
            name="request_department"
            className="form-control"
            value={data.request_department||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Patient Type
          </label>
          <input
            type="text"
            name="patient_type"
            className="form-control"
            value={data.patient_type||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Institution Name
          </label>
          <input
            type="text"
            name="institution_name"
            className="form-control"
            value={data.institution_name||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-12 mt-2 ">
          <label  className="form-label">
          Clinical Summary
          </label>
          <textarea
            type="text"
            name="clinical_summary"
            className="form-control"
            value={data.clinical_summary||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Appointment Date
          </label>
          <input
            type="date"
            name="appointment_date"
            className="form-control"
            value={data.appointment_date||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
            Appointment Time
          </label>
          <input
            type="time"
            className="form-control"
            name='appointment_time'
            value={data.appointment_time||''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label  className="form-label">
           Accesion Number
          </label>
          <input
            type="text"
            className="form-control"
            value={data.accesion_number||''}
            readOnly
          />
        </div>
      </div>
      <button className="btn otjs-button otjs-button-blue mt-4 mx-auto d-block">Save</button>
      </form>
    </>
  );
};

export default Registration;
