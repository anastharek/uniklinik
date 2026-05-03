import React,{useRef} from "react";
import "./report-popup.css";
import { Close, FileCopy } from "@material-ui/icons";
import { toast } from "react-toastify";
const ReportPoopup = ({ data,display='none',setPrevData }) => {
    const textRef = useRef(null);   
    const copy=()=>{
        textRef.current.select();
        document.execCommand('copy');
        toast.success('text copied on clipboard')
    }
  return (
    <div style={{display}} className="report-popup">
      <div className="temp">
      <button onClick={()=>setPrevData(null)} className="btn" style={{color:'#fff',fontSize:30,fontWeight:'bold'}}>
            <Close fontSize="50px"/>
        </button>
      <div className="container">
        <p className="h2 text-center mb-4">Previous Report</p>
        <div className="row d-flex">
          <div className="col-6">
            <label for="pname" class="form-label">
              Patient's Name
            </label>
            <input
              value={data?.patient_name}
              className="form-control"
              readOnly
            />
          </div>
          <div className="col-6">
            <label for="pid" class="form-label">
              Patient's ID
            </label>
            <input
              value={data?.patient_id}
              readOnly
              className="form-control"
            />
          </div>
        </div>
        <br />
        <div className="row d-flex">
          <div className="col-6">
            <label for="stype" class="form-label">
              Study Type
            </label>
            <input
              value={data?.study_type}
              className="form-control"
              readOnly
            />
          </div>

          <div className="col-6">
            <label for="sdata" class="form-label">
              Study Date
            </label>
            <input
              value={data?.study_date}
              className="form-control"
              readOnly
            />
          </div>
        </div>
        <div className="row d-flex mt-5">
          <div style={{position:'relative'}} className="col-12">
            <button className="btn copy-btn "  onClick={copy} style={{color:'grey'}}>
               <FileCopy/> 
            </button>
            <textarea
              ref={textRef}
              className="form-control"
              cols="12"
              rows="20"
              name="text"
              value={data?.text}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ReportPoopup;
