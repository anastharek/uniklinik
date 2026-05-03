import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Dropzone from "react-dropzone";
import { DataGrid } from "@material-ui/data-grid";
import axios from "axios";
import getColumsByData from "../../../utils/getDataColumnByTable";
import { toast } from "react-toastify";
import { Typeahead } from "react-bootstrap-typeahead";
import { Modal, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import moment from "moment";
const modalities = [
  "Computed Tomography",
  "Digital Radiography",
  "Computed Radiography",
  "Magnetic Resonance",
  "Ultrasound",
  "Mammography",
  "Positron emission tomography",
  "Nuclear Medicine",
  "Radiotherapy Dose",
  "Radiotherapy Image",
  "Radiotherapy Plan",
  "RT Treatment Record",
  "Radiotherapy Structure Set",
  "Segmentation",
];
const EditDatasetPopup = ({ id, handleClose, refresh }) => {
  const [data, setData] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [users, setUsers] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const role = useSelector((state) => state.PadiMedical.roles);
  const [sequence, setSequence] = useState([]);
  const handleChange = (e) => {
    if (e.target.name === "study_field") {
      return setData({
        ...data,
        [e.target.name]: e.target.value.toUpperCase(),
      });
    }
    setData({ ...data, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    axios
      .get("/api/dataverse/" + id)
      .then((res) => {
        setData({
          ...res.data,
          type: res.data.dataset_type,
          users: res.data.coOwner.map(
            (element) =>
              `${element["User.firstname"]}  ${element["User.lastname"]} (${element["User.username"]})`
          ),
        });
        setSequence(res.data.column_sequence || []);
        setPreviewData(res.data.preview_data);
        setAllData(res.data.all_data);
      })
      .catch((err) => {
      });
    fetch("/api/users")
      .then((res) => res.json())
      .then((resJson) => setUsers(resJson))
      .catch((err) => console.log(err));
  }, []);

  const cleanText = (text) =>
  typeof text === "string"
    ? text
        .replace(/[–—]/g, "-")   // normalize dashes
        .replace(/[“”]/g, '"')   // normalize quotes
        .replace(/[‘’]/g, "'")   // normalize apostrophes
    : text;

  const handleDropPreview = (files) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const filteredData = parsedData.filter((row) =>
          row.some((cell) => cell !== undefined && cell !== null && cell !== "")
        );
        const header = filteredData[0]; // Assuming the first row contains headers
        const rows = filteredData.slice(1); // Remaining rows are data
        const jsonData = rows.map((row) => {
          const rowData = {};
          row.forEach((value, index) => {
            if (header[index].toLowerCase().includes("date")) {
              const date = moment("1899-12-30"); // Excel base date
              date.add(value, "days");
              if (date.isValid() && typeof value === "number") {
                rowData[header[index]] = date.format("DD/MM/YYYY");
              } else {
                rowData[header[index]] = cleanText(value);
              }
            } else {
              rowData[header[index]] = cleanText(value);
            }
          });
          return rowData;
        });
        setPreviewData(jsonData);
        setSequence(header);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDropAllData = (files) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const filteredData = parsedData.filter((row) =>
          row.some((cell) => cell !== undefined && cell !== null && cell !== "")
        );
        const header = filteredData[0]; // Assuming the first row contains headers
        const rows = filteredData.slice(1); // Remaining rows are data
        const jsonData = rows.map((row) => {
          const rowData = {};
          row.forEach((value, index) => {
            if (header[index].toLowerCase().includes("date")) {
              const date = moment("1899-12-30"); // Excel base date
              date.add(value, "days");
              if (date.isValid() && typeof value === "number") {
                rowData[header[index]] = date.format("DD/MM/YYYY");
              } else {
                rowData[header[index]] = cleanText(value);
              }
            } else {
              rowData[header[index]] = cleanText(value);
            }
          });
          return rowData;
        });
        setAllData(jsonData);
        setSequence(header);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = {
      ...data,
      preview_data: previewData,
      all_data: allData,
      sequence: sequence.length ? sequence : undefined,
    };
    axios
      .put("/api/dataverse", payload)
      .then((res) => {
        toast.success("Dataset updated successfully");
        if (handleClose) handleClose();
        if (refresh) refresh();
      })
      .catch((err) => {
        toast.error("Failed to update dataset");
      });
  };

  const makeDelete = () => {
    setShowDelete(false);
    axios
      .delete("/api/dataverse/" + id)
      .then((res) => {
        toast.success("Dataset deleted successfully");
        if (handleClose) handleClose();
        if (refresh) refresh();
      })
      .catch((err) => {
        toast.error("Failed to delete dataset");
      });
  };

  return (
    <div
      style={{
        position: "fixed",
        width: "100vw",
        top: 0,
        left: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 1000,
        padding: 50,
        height: "100vh",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "98%",
          maxWidth: 900,
          marginInline: "auto",
          padding: 20,
          height: "90vh",
          overflowY: "auto",
          borderRadius: 10,
        }}
      >
        <h5>Edit Dataset</h5>
        <form onSubmit={handleSubmit} className="mt-5">
          <div className="row d-flex">
            <div className="col-6">
              <label for="name" class="form-label">
                Dataset Name
              </label>
              <input
                required
                name="name"
                onChange={handleChange}
                id="name"
                value={data.name}
                className="form-control"
              />
            </div>
            <div className="col-6">
              <label for="researcher_name" class="form-label">
                Researcher Name
              </label>
              <input
                required
                name="researcher_name"
                value={data.researcher_name}
                onChange={handleChange}
                id="researcher_name"
                className="form-control"
              />
            </div>
            <div className="col-12 mt-3">
              <label for="researcher_name" class="form-label">
                Dataset Details
              </label>
              <textarea
                required
                name="detail"
                value={data.detail}
                onChange={handleChange}
                id="researcher_name"
                className="form-control"
                rows={5}
              />
            </div>
            <div className="col-6 mt-3">
              <label for="no_of_samples" class="form-label">
                No. of samples
              </label>
              <input
                required
                name="sample_count"
                value={data.sample_count}
                onChange={handleChange}
                id="no_of_samples"
                className="form-control"
                type="number"
              />
            </div>
            <div className="col-6 mt-3">
              <label for="dataset_type" class="form-label">
                File Type
              </label>
              <select
                required
                name="dataset_type"
                value={data.dataset_type}
                onChange={handleChange}
                id="dataset_type"
                className="form-select"
              >
                <option hidden value="">
                  select file type
                </option>
                <option value="JPEG">JPEG</option>
                <option value="PNG">PNG</option>
                <option value="DICOM">DICOM</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </div>
            <div className="col-6 mt-3">
              <label for="study_field" class="form-label">
                Study Field
              </label>
              <input
                required
                name="study_field"
                value={data.study_field}
                onChange={handleChange}
                id="study_field"
                className="form-control"
              />
            </div>
            <div className="col-6 mt-3">
              <label for="pricing_type" class="form-label">
                Pricing Type
              </label>
              <select
                required
                name="pricing_type"
                value={data.pricing_type}
                onChange={handleChange}
                id="dataset_type"
                className="form-select"
              >
                <option hidden value=""></option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {data.pricing_type == "paid" && (
              <div className="col-6 mt-3">
                <label for="price_range" class="form-label">
                  Price Range
                </label>
                <input
                  required
                  name="price_range"
                  value={data.price_range}
                  onChange={handleChange}
                  id="price_range"
                  className="form-control"
                />
              </div>
            )}
            <div className="col-6 mt-3">
              <label for="modalities" class="form-label">
                Modalities
              </label>
              <select
                required
                name="modality"
                onChange={handleChange}
                id="modality"
                className="form-select"
                value={data.modality}
              >
                <option hidden value="">
                  Select Modality
                </option>
                {modalities.map((modality, index) => (
                  <option value={modality} key={index}>
                    {modality}
                  </option>
                ))}
              </select>
            </div>
            {(role.admin || role.id == data.owner) && (
              <div className="col-6 mt-3">
                <label for="assign-users" class="form-label">
                  Assign Users
                </label>
                <Typeahead
                  multiple
                  onChange={(selected) => {
                    setData({ ...data, users: selected });
                  }}
                  options={users.map(
                    (element) =>
                      `${element.firstname}  ${element.lastname} (${element.username})`
                  )}
                  selected={data.users}
                  id="assign-users"
                />
              </div>
            )}
            <div className="col-12 mt-3">
              <Dropzone onDrop={handleDropPreview}>
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div className={"dropzone"} {...getRootProps()}>
                      <div
                        className="responsive"
                        style={{
                          width: "114px",
                          position: "relative",
                          left: "41%",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "31%",
                            left: "76%",
                            width: 130,
                          }}
                        ></div>
                      </div>
                      <input {...getInputProps()} accept=".xlsx" />
                      <p>Drag & Drop Preview Excel files here</p>
                    </div>
                  </section>
                )}
              </Dropzone>
            </div>
            {previewData.length > 0 && (
              <DataGrid
                rows={previewData.map((row, index) => ({ id: index, ...row }))}
                columns={getColumsByData(previewData,sequence)}
                style={{ height: 450, width: "100%" }}
              />
            )}
            <div className="col-12 mt-3">
              <Dropzone onDrop={handleDropAllData}>
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div className={"dropzone"} {...getRootProps()}>
                      <div
                        className="responsive"
                        style={{
                          width: "114px",
                          position: "relative",
                          left: "41%",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "31%",
                            left: "76%",
                            width: 130,
                          }}
                        ></div>
                      </div>
                      <input {...getInputProps()} accept=".xlsx" />
                      <p>Drag & Drop Finalize Excel files here</p>
                    </div>
                  </section>
                )}
              </Dropzone>
            </div>
            {allData?.length > 0 && (
              <DataGrid
                rows={allData.map((row, index) => ({ id: index, ...row }))}
                columns={getColumsByData(allData,sequence)}
                style={{ height: 600, width: "100%" }}
              />
            )}
            <div className="col-12 mt-3 d-flex justify-content-between">
              <div>
                <button
                  type="submit"
                  className="btn otjs-button otjs-button-blue"
                >
                  Submit
                </button>
                <button
                  onClick={handleClose}
                  type="button"
                  className="btn otjs-button btn-warning ms-4"
                >
                  Close
                </button>
              </div>
              <div>
                <div>
                  {(role.delete_dataset || role.id == data.owner) && (
                    <button
                      onClick={() => setShowDelete(true)}
                      type="button"
                      className="btn otjs-button btn-danger ms-4"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Modal show={showDelete} id="delete" size="md">
        <Modal.Header closeButton>
          <h4 className="card-title text-center">
            You are deleting this dataset ??
          </h4>
        </Modal.Header>
        <Modal.Body className="p-2">
          You are about to delete this dataset This action is irreversible. Are
          you sure you want to delete this dataset?
        </Modal.Body>
        <Modal.Footer>
          <Row className="text-center mt-2">
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-blue"
                onClick={() => setShowDelete(false)}
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
    </div>
  );
};

export default EditDatasetPopup;
