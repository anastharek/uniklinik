import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Dropzone from "react-dropzone";
import { DataGrid } from "@material-ui/data-grid";
import axios from "axios";
import getColumsByData from "../../../utils/getDataColumnByTable";
import { toast } from "react-toastify";
import { Typeahead } from "react-bootstrap-typeahead";
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
const CreateDataset = () => {
  const [data, setData] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [users, setUsers] = useState([]);
  const [allData, setAllData] = useState([]);
  const [sequence, setSequence] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((resJson) => setUsers(resJson))
      .catch((err) => console.log(err));
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "study_field") {
      return setData({
        ...data,
        [e.target.name]: e.target.value.toUpperCase(),
      });
    }
    setData({ ...data, [e.target.name]: e.target.value });
  };

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
        setSequence(header);
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
        setSequence(header);
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
      .post("/api/dataverse", payload)
      .then((res) => {
        toast.success("Dataset Created Successfully");
        setData({});
        setPreviewData([]);
        setAllData([]);
      })
      .catch((err) => {
        toast.error("Failed to create dataset");
      });
  };
  return (
    <div>
      <h5>Create Dataset</h5>
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
              className="form-control"
              value={data.name}
            />
          </div>
          <div className="col-6">
            <label for="researcher_name" class="form-label">
              Researcher Name
            </label>
            <input
              required
              name="researcher_name"
              onChange={handleChange}
              id="researcher_name"
              className="form-control"
              value={data.researcher_name}
            />
          </div>
          <div className="col-12 mt-3">
            <label for="detail" class="form-label">
              Dataset Details
            </label>
            <textarea
              required
              name="detail"
              onChange={handleChange}
              id="detail"
              className="form-control"
              rows={5}
              value={data.detail}
            />
          </div>
          <div className="col-6 mt-3">
            <label for="no_of_samples" class="form-label">
              No. of samples
            </label>
            <input
              required
              name="sample_count"
              onChange={handleChange}
              id="no_of_samples"
              className="form-control"
              type="number"
              value={data.sample_count}
            />
          </div>
          <div className="col-6 mt-3">
            <label for="dataset_type" class="form-label">
              File Type
            </label>
            <select
              required
              name="dataset_type"
              onChange={handleChange}
              id="dataset_type"
              className="form-select"
              value={data.dataset_type}
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
              onChange={handleChange}
              id="dataset_type"
              className="form-select"
              value={data.pricing_type}
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
                onChange={handleChange}
                id="price_range"
                className="form-control"
                value={data.price_range}
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
          {allData.length > 0 && (
            <DataGrid
              rows={allData.map((row, index) => ({ id: index, ...row }))}
              columns={getColumsByData(allData,sequence)}
              style={{ height: 600, width: "100%" }}
            />
          )}
          <div className="col-12 mt-3">
            <button type="submit" className="btn otjs-button otjs-button-blue">
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateDataset;
