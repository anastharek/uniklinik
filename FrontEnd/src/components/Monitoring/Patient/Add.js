import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const AddPatient = ({refresh}) => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState({
    name: "",
    patient_id: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    apis.patients.create(user)
      .then((response) => {
          setShow(false);
          setUser({
            name: "",
            patient_id: "",
            email: "",
            phone: "",
          });
          toast.success("Patient created successfully");
      })
      .catch((error) => {
        toast.error(error.response.data.message || "Error creating patient");
        console.clear();
      }).finally(refresh);
  }

  return (
    <>
      <button
        type="button"
        name="create"
        className="otjs-button otjs-button-blue"
        onClick={() => setShow(true)}
      >
        New Patient
      </button>
      <Modal
        id="create"
        show={show}
        onHide={()=>setShow(prev=> !prev)}
        size="md"
      >
        <Modal.Header closeButton>
          <h2 className="card-title">Create Patient</h2>
        </Modal.Header>
        <Modal.Body>
          <fieldset className="mt-3">
            <label>Name*</label>
            <input
              className="form-control"
              type="text"
              placeholder="Name"
              name="name"
              value={user.name}
              onChange={handleChange}
              required
            />
          </fieldset>
          <fieldset className="mt-3">
            <label>Patient ID*</label>
            <input
              className="form-control"
              type="text"
              placeholder="Patient ID"
              name="patient_id"
              value={user.patient_id}
              onChange={handleChange}
              required
            />
          </fieldset>
          <fieldset className="mt-3">
            <label>Email*</label>
            <input
              className="form-control"
              type="email"
              placeholder="Email"
              name="email"
              value={user.email}
              onChange={handleChange}
              required
            />
          </fieldset>
          <fieldset className="mt-3">
            <label>Phone*</label>
            <input
              className="form-control"
              type="text"
              placeholder="Phone"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              required
            />
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="otjs-button otjs-button-blue"
            onClick={handleSubmit}
          >
            Create
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddPatient;
