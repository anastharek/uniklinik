import React from "react";
import Modal from "react-bootstrap/Modal";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const DeletePatient = ({refresh,visible,deleteData,setDeleteData}) => {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    apis.patients.delete(deleteData.id)
      .then(() => {
          setDeleteData(null);
          toast.success("Patient deleted successfully");
      })
      .catch((error) => {
        toast.error(error.response.data.message || "Error deleting patient");
        console.clear();
      }).finally(refresh);
  }

  return (
    <>
      <Modal
        id="delete"
        show={visible}
        onHide={()=>setDeleteData(null)}
        size="md"
      >
        <Modal.Header closeButton>
          <h2 className="card-title">Delete Patient</h2>
        </Modal.Header>
        <Modal.Body>
          <h6 className="my-2">Are you sure you want to delete this patient?</h6>
          <br />
          <br />
          <p>Patient Name: {deleteData?.name}</p>
          <p>Patient ID: {deleteData?.patient_id}</p>
          <p>Email: {deleteData?.email}</p>
          <p>Phone: {deleteData?.phone}</p>
          <b className="text-danger">This action cannot be undone. !!</b>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="otjs-button otjs-button-red"
            onClick={handleSubmit}
          >
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeletePatient;
