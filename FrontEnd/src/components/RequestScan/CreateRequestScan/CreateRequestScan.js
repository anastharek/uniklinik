import React, { useState, useEffect } from "react";
import { InputGroup, Row, Form } from "react-bootstrap";
import { TagTable } from "../../CommonComponents/RessourcesDisplay/ReactTable/TagTable";
import Button from "react-bootstrap/Button";
import { Typeahead } from "react-bootstrap-typeahead";
import pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const CreateRequestScanSection = () => {
  const history = useHistory();
  const [state, setState] = useState({
    tags: [
      {
        TagName: "PatientID",
        Value: "",
        deletable: false,
        editable: true,
      },
      {
        TagName: "PatientName",
        Value: "",
        deletable: false,
        editable: true,
      },
      {
        TagName: "Phone",
        Value: "",
        deletable: false,
        editable: true,
      },
    ],
    files: [],
    reportDetails: "",
  });
  const [user, setUser] = useState([]);
  const [tags, setTags] = React.useState([]);
  useEffect(() => {
    fetch("/api/users/radiologist")
      .then((res) => res.json())
      .then((res) => setUser(res))
      .catch((err) => console.log("err"));
  }, []);

  const handleDataChange = (oldValue, newValue, row, column) => {
    let tags = [...state.tags];
    if (column === "Value") {
      tags.find((x) => x.TagName === row.TagName)[column] = newValue;
    } else {
      tags = tags.filter((x) => x.TagName !== row.TagName);
    }
    setState((prev) => ({ ...prev, tags }));
  };

  const handleChange = (e) => {
    setState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createReport = async () => {
    let payload = {
      clinic_name: state.clinic,
      modality: state.modality,
      indication: state.indication,
      image: state.image,
      date: state.date,
      patient_name: state.tags.filter((obj) => obj.TagName === "PatientName")[0]
        ?.Value,
      patient_id: state.tags.filter((obj) => obj.TagName === "PatientID")[0]
        ?.Value,
      phone: state.tags.filter((obj) => obj.TagName === "Phone")[0]
        ?.Value,
      doctors: tags,
    };
    let optional = ["image", "doctors"];
    let errorArray = Object.keys(payload).map((key) => {
      if (!optional.includes(key)) {
        if (!payload[key] || payload[key] == "") {
          return `${key} is required`;
        }
      }
    });
    errorArray = errorArray.filter((text) => text);
    if (errorArray.length > 0) {
      errorArray.map((text) => toast.error(text));
      return;
    }

    fetch("/api/request-scan", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          toast.success("request scan created sucessfully");
          history.push("/padimedical-content");
        }
      })
      .catch(() => toast.error("something went wrong"));
  };
  state.tags.map((obj) => {
    if (obj.TagName == "StudyDescription") {
    }
  });

  async function encodeImageFileAsURL(element) {
    var file = element.target.files[0];
    var reader = new FileReader();
    reader.onloadend = function () {
      setState((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <Row className="pb-3">
      <InputGroup
        style={{ marginBottom: 20, display: "flex", flexWrap: "nowrap" }}
      >
        <InputGroup.Text>Request details</InputGroup.Text>
        <div
          style={{
            width: "100%",
            border: "2px solid #eeeeee",
            borderRadius: 5,
            padding: "20px 10px",
          }}
        >
          <div className="d-flex justify-content-between my-3 align-items-center  ">
            <Form.Label
              style={{ fontSize: 16, marginBottom: -5, textAlign: "left" }}
            >
              Clinic
            </Form.Label>
            <Form.Control
              name="clinic"
              onChange={handleChange}
              style={{
                border: "none",
                borderBottom: "1px solid #eee",
                outline: "none",
                borderRadius: 0,
                width: "90%",
              }}
            />
          </div>

          <div className="d-flex justify-content-between my-3 align-items-center">
            <Form.Label
              style={{ fontSize: 16, marginBottom: -5, textAlign: "left" }}
            >
              Modality
            </Form.Label>
            <Form.Control
              name="modality"
              onChange={handleChange}
              style={{
                border: "none",
                borderBottom: "1px solid #eee",
                outline: "none",
                borderRadius: 0,
                width: "90%",
              }}
            />
          </div>
          <div className="d-flex justify-content-between my-3 align-items-center">
            <Form.Label style={{ fontSize: 16 }}>Indication</Form.Label>
            <Form.Control
              name="indication"
              onChange={handleChange}
              style={{
                border: "none",
                borderBottom: "1px solid #eee",
                outline: "none",
                borderRadius: 0,
                width: "90%",
              }}
            />
          </div>
        </div>
      </InputGroup>
      <TagTable data={state.tags} onDataUpdate={handleDataChange} />
      <div className="row">
        <div className="col-6">
          <Form.Label style={{ fontSize: 16 }}>Upload request form (optional)</Form.Label>
          <Form.Control onChange={encodeImageFileAsURL} type="file" />
        </div>
        <div className="col-6">
          <Form.Label style={{ fontSize: 16 }}>Assign Doctor (optional)</Form.Label>
          <Typeahead
            multiple
            onChange={(selected) => {
              setTags(selected);
            }}
            options={user.map(
              (element) =>
                `Dr. ${element.firstname}  ${element.lastname} (${element.username})`
            )}
            selected={tags}
            id="doctors"
          />
        </div>
        <div className="col-6">
          <Form.Label style={{ fontSize: 16 }}>Date</Form.Label>
          <Form.Control
            onChange={handleChange}
            required
            type="date"
            name="date"
          />
        </div>
      </div>

      <div className={"w-100 d-flex justify-content-between otjs-button mt-5"}>
        <Button type={"submit"} onClick={createReport}>
          {"Request scan"}
        </Button>
      </div>
    </Row>
  );
};
