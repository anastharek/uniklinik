import { useEffect, useState } from "react";
import apis from "../../services/apis";
import { Modal, Row, Col, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import AdminCaseListTable from "./AdminCaseListTable";
import SelectModalities from "../CommonComponents/SearchForm/SelectModalities";
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const saveLocalData = (seachData, data) => {
  localStorage.setItem("previous_admin_data", JSON.stringify(seachData));
  localStorage.setItem("previous_admin_key", JSON.stringify(data));
};

const deleteLocalData = () => {
  localStorage.removeItem("previous_admin_data");
  localStorage.removeItem("previous_admin_key");
};

const ExportExcel = (data) => {
  return (
    <ExcelFile
      element={
        <button
          style={{ width: "max-content" }}
          className="otjs-button otjs-button-green"
        >
          Export/Download
        </button>
      }
    >
      <ExcelSheet data={data.data} name="Employees">
        <ExcelColumn label="Patient Name" value="patient_name" />
        <ExcelColumn label="Patient ID" value="patient_id" />
        <ExcelColumn label="Accesion" value="accessor" />
        <ExcelColumn label="Study Type" value={"study_type"} />
        <ExcelColumn label="Study Date" value={"study_date"} />
        <ExcelColumn
          label="Status"
          value={(col) =>
            col.addendumby === undefined ? "Not Finalize" : "Finalize"
          }
        />
        <ExcelColumn
          label="Doctor Incharge"
          value={(col) => col.doctors.join(" , ")}
        />
      </ExcelSheet>
    </ExcelFile>
  );
};

const SearchForm = ({ setReports ,setRandom}) => {
  const [data, setData] = useState({});

  useEffect(() => {
    let data = localStorage.getItem("previous_admin_data");
    if (data) {
      let keyLocal = localStorage.getItem("previous_admin_key");
      try {
        keyLocal = JSON.parse(keyLocal);
        setData(keyLocal);
        apis.caseList.searchCaseList(keyLocal).then((res) => {
          setReports(res);
        });
      } catch {}
    } else {
      apis.caseList.getAdmin().then((res) => setReports(res));
    }
  }, []);

  const handleChange = (e) => {
    setData((prevdata) => ({ ...prevdata, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.study_date) {
      data.study_date = data.study_date.replaceAll("-", "");
    }
    apis.caseList
      .searchCaseList(data)
      .then((res) => {
        saveLocalData(res, data);
        setReports(res);
        setRandom(Math.random())
      })
      .catch((err) => console.log(err));
  };


  return (
    <div className="d-flex flex-wrap">
      <div className="row mt-4">
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="patient_name" className="form-label">
            Patient Name
          </label>
          <input
            type="text"
            name="patient_name"
            id="patient_name"
            value={data.patient_name}
            onChange={handleChange}
            className="form-control"
            placeholder="Patient Name"
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="patient_id" className="form-label">
            Patient ID
          </label>
          <input
            type="text"
            name="patient_id"
            id="patient_id"
            value={data.patient_id}
            onChange={handleChange}
            className="form-control"
            placeholder="Patient ID"
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
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
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
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
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="doctors" className="form-label">
            Keyword
          </label>
          <input
            type="text"
            name="keyword"
            id="keyword"
            value={data.keyword}
            className="form-control"
            placeholder="keyword"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="doctors" className="form-label">
            Doctors
          </label>
          <input
            type="text"
            name="doctors"
            value={data.doctors}
            id="doctors"
            className="form-control"
            placeholder="Study Description"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="nric" className="form-label">
            NRIC
          </label>
          <input
            type="text"
            name="nric"
            value={data.nric}
            id="nric"
            className="form-control"
            placeholder="NRIC"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="RefPhysicianName" className="form-label">
            Referring Centre
          </label>
          <input
            type="text"
            name="RefPhysicianName"
            value={data.RefPhysicianName}
            id="RefPhysicianName"
            className="form-control"
            placeholder="Referring Centre"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="accesor" className="form-label">
            Accesion Number
          </label>
          <input
            type="text"
            name="accesor"
            value={data.accesor}
            id="accesor"
            className="form-control"
            placeholder="Accesion Number"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="" className="form-label">
           Type
          </label>
          <select
            type="text"
            name="type"
            value={data.type}
            id="accesor"
            className="form-select"
            onChange={handleChange}
          >
            <option hidden value=''></option>
            <option value='normal'>Normal</option>
            <option value='abnormal'>Abnormal</option>
            </select>
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="label" className="form-label">
            Lable
          </label>
          <input
            type="text"
            name="label"
            value={data.label}
            id="label"
            className="form-control"
            placeholder="Label"
            onChange={handleChange}
          />
        </div>
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <label htmlFor="InstitutionName" className="form-label">
          Institution Name
          </label>
          <input
            type="text"
            name="InstitutionName"
            value={data.InstitutionName}
            id="InstitutionName"
            className="form-control"
            placeholder="Institution Name"
            onChange={handleChange}
          />
        </div>
        {/* <div className="mt-5 col-12 col-sm-4 col-md-3 col-lg-4">
          <SelectModalities previousModalities="" onUpdate={onUpdate} />
        </div> */}
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

const AdminCaseList = () => {
  const [reports, setReports] = useState([]);
  const [id, setID] = useState(null);
  const [show, setShow] = useState(false);
  const [random, setRandom] = useState(Math.random());
  const fetchData = () => {
    apis.caseList.getAdmin().then((res) => setReports(res));
    setRandom(Math.random());
  };

  const makeDelete = () => {
    fetch("/api/admin-report", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "DELETE",
      body: JSON.stringify({
        studyid: id,
      }),
    }).then(() => {
      fetchData();
      toast.success("Report Removed !!");
      setShow(false);
    });
  };

  const setDelete = (id) => {
    setID(id);
    setShow(true);
  };
  return (
    <>
      <div>
        <div className="d-flex ms-auto" style={{ width: "max-content" }}>
          <button
            style={{ maxWidth: 150 }}
            onClick={() => {
              deleteLocalData();
              fetchData();
              setRandom(Math.random());
            }}
            id="refresh-btn"
            className="btn otjs-button otjs-button-orange p-2"
          >
            Refresh
          </button>
          <div style={{ maxWidth: 150, marginLeft: 20 }}>
            <ExportExcel key={Math.random()} data={reports} />
          </div>
        </div>
        <SearchForm key={random} setRandom={setRandom} setReports={setReports} />
      </div>
      <br />
      <AdminCaseListTable key={random} reports={reports} setDelete={setDelete} refresh={fetchData} />
      <Modal show={show} id="delete" size="sm">
        <Modal.Header closeButton>
          <h2 className="card-title">Delete Report</h2>
        </Modal.Header>
        <Modal.Body className="text-center">
          Are You sure to delete ?
        </Modal.Body>
        <Modal.Footer>
          <Row className="text-center mt-2">
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-blue"
                onClick={() => setShow(false)}
              >
                Close
              </button>
            </Col>
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-red"
                onClick={makeDelete}
              >
                Delete
              </button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminCaseList;
