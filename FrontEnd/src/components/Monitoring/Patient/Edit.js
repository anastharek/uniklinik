import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const EditPatient = ({refresh,visible,editData,setEditData}) => {
  const [user, setUser] = useState({name:"",patient_id:"",email:"",phone:"",});

  useEffect(() => {
    setUser({
        name: editData?.name || "",
        patient_id: editData?.patient_id || "",
        email: editData?.email || "",
        phone: editData?.phone || "",
    });
  }, [editData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    apis.patients.update(editData.id,user)
      .then((response) => {
          setEditData(null);
          setUser({
            name: "",
            patient_id: "",
            email: "",
            phone: "",
          });
          toast.success("Patient updated successfully");
      })
      .catch((error) => {
        toast.error(error.response.data.message || "Error updating patient");
        console.clear();
      }).finally(refresh);
  }

  return (
    <>
      <Modal
        id="edit"
        show={visible}
        onHide={()=>setEditData(null)}
        size="md"
      >
        <Modal.Header closeButton>
          <h2 className="card-title">Edit Patient</h2>
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
            Save
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditPatient;
