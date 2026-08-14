import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import PatientReportTable from "./PatientReportTable";
import './patient.css'
import apis from "../../services/apis";
import moment from "moment";
import { useSelector } from "react-redux";
const sampleData = [
    { id: "P001", study_type: "X-Ray", studyDate: "15 JAN 24" },
    { id: "P002", study_type: "MRI", studyDate: "15 JAN 24" },
  ];

const SearchForm = ({ setReports ,setRandom}) => {
    const [data, setData] = useState({});

    useEffect(() => {
      apis.caseList.searchPatientCaseList(data)
        .then((res) => {
          setReports(res)
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    },[]);



    const handleChange = (e) => {
      setData((prevdata) => ({ ...prevdata, [e.target.name]: e.target.value }));
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      let temp = {...data };
      if (temp.study_date) {
        temp.study_date = moment(temp.study_date).format("YYYYMMDD").toString();
      }
      apis.caseList.searchPatientCaseList(temp)
        .then((res) => {
          setReports(res)
          setRandom(Math.random())
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    };
    return (
      <div className="d-flex flex-wrap col-12 mb-4">
        <div className="row col-12 my-6 mx-auto">
          <div className="col-12 col-md-4">
            <label htmlFor="study_type" className="form-label">
              Study Type
            </label>
            <input
              type="text"
              name="study_type"
              id="study_type"
              value={data.study_type}
              onChange={handleChange}
              className="form-control"
              placeholder="Study Type"
            />
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="study_date" className="form-label">
              Study Date
            </label>
            <input
              type="date"
              name="study_date"
              id="study_date"
              value={data.study_date}
              className="form-control"
              placeholder="Study Date"
              onChange={handleChange}
            />
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="doctors" className="form-label">
              Keyword
            </label>
            <input
              type="text"
              name="keyword"
              id="keyword"
              className="form-control"
              placeholder="keyword"
              value={data.keyword}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 mt-4 justify-content-center d-flex">
            <button
              onClick={handleSubmit}
              className="btn otjs-button otjs-button-blue p-1"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    );
};

  
const Patient=()=>{
    const [reports, setReports] = useState([]);
    const [random, setRandom] = useState(Math.random());
    const roles = useSelector(state => state.PadiMedical.roles);
    return(
      <>
        <div className="patient-area">
          <div className="flex mb-4 text-center">
            <span className="h5">Name : {roles?.patient_name}</span>
            <span className="ms-4 h5">ID : {roles?.username}</span>
          </div>
          <SearchForm  setReports={setReports} setRandom={setRandom} />
          <PatientReportTable key={random} tableData={reports} />
        </div>
      </>
    )
}

export default Patient;