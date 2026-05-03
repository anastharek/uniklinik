import { useCallback, useEffect, useState } from "react";
import AppointmentTable from "./AppointmentTable";
import axios from "axios";
import SweetAlert from "react-bootstrap-sweetalert";
import { toast } from "react-toastify";
import dataFormator from "../../../utils/appointmentDataFormator";

const Appointment = () => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState({});
  const [changeData,setChangeData]=useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    axios
      .get("/api/demographic/appointment",{params:{...query,appointment_datetime:query.appointment_datetime&&new Date(query.appointment_datetime)}})
      .then((res) => setData(res.data.appointment || []))
      .catch((err) => console.log(err));
  };

  const handleChange = (e) =>
    setQuery((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDataChage=(initialValue,value, row, column)=>{
    if(column=='status'){
      setChangeData({...row,status:value});
  }
    let temp=[...data]
    temp.find(obj => obj.id === row.id)[column] = value;
    setData(data) 
  }

  const updateStatus=()=>{
    axios.put(`/api/demographic/appointment/${changeData.id}`,{id:changeData.id,status:changeData.status})
    .then(res=>toast.success('updated successfully !'))
    .catch(err=>toast.error('something went wrong !'))
    .finally(()=>{setChangeData(null);handleSearch()})
  }

  const handleSave=useCallback((id)=>{
    let index=data.findIndex(obj=>obj.id==id)
    axios.put(`/api/demographic/appointment/${id}`,{...dataFormator(data[index])})
    .then(res=>toast.success('updated successfully !'))
    .catch(err=>toast.error('something went wrong !'))
    .finally(()=>{setChangeData(null);handleSearch()})
  },[data])
  return (
    <div>
   {changeData &&
    <SweetAlert
    warning
    title='Are you sure ?'
    confirmBtnText='Confirm'
    showCancel
    cancelBtnText='No'
    confirmBtnCssClass="btn btn-md btn-danger ms-4"
    onConfirm={updateStatus}
    onCancel={()=>setChangeData(null)}
    >
         you want to make status as {changeData.status} ?
    </SweetAlert>
   }
      <form onSubmit={handleSearch} className="row mb-5">
        <div className="col-lg-4 mt-2 col-12">
          <label className="form-label">Modality Type</label>
          <select
            className="form-select"
            name="modality_type"
            value={query.modality_type||''}
            onChange={handleChange}
          >
            <option value="" hidden>
              Select option
            </option>
            <option value="XA">XA</option>
            <option value="CT">CT</option>
            <option value="MRI">MRI</option>
            <option value="US">US</option>
            <option value="XR">XR</option>
          </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            name="status"
            value={query.status||''}
            onChange={handleChange}
          >
            <option value="" hidden>
              Select option
            </option>
            <option value="schedule">Schedule</option>
            <option value="arrived">Arrived</option>
            <option value="performed">Performed</option>
          </select>
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label className="form-label">Patient ID</label>
          <input
            className="form-control"
            name="patient_id"
            value={query.patient_id||''}
            onChange={handleChange}
          />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label className="form-label">Patient Name</label>
          <input className="form-control" name="name" value={query.name||''} onChange={handleChange} />
        </div>
        <div className="col-lg-4 mt-2 col-12">
          <label className="form-label">Appointment Date</label>
          <input
            className="form-control"
            name="appointment_datetime"
            type="date"
            value={query.appointment_datetime||''}
            onChange={handleChange}
          />
        </div>
        <div className="d-flex justify-content-center my-3">
        <button type="submit" className="btn otjs-button otjs-button-blue">Search</button>
        <button type="button" onClick={()=>setQuery({})} className="btn otjs-button otjs-button-orange ms-4">Clear</button>
        </div>

      </form>
      {/* <div className="row my-3">
        <p className="col-6 text-center h6">Today Appointment : 0</p>
        <p className="col-6 text-center h6">UpComming Appointment : 0</p>
      </div> */}
      <AppointmentTable 
      tableData={data} 
      changeHandler={handleDataChage}
      saveModal={handleSave}
      />
    </div>
  );
};

export default Appointment;
