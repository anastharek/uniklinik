import React from "react";
import Modal from "react-bootstrap/Modal";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const DeletePadilabel = ({ refresh, visible, deleteData, setDeleteData }) => {

    const handleSubmit = (e) => {
        e.preventDefault();
        apis.padilabels.delete(deleteData.id)
            .then(() => {
                setDeleteData(null);
                toast.success("Padilabel deleted successfully");
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "Error deleting padilabel");
                console.clear();
            }).finally(refresh);
    }

    return (
        <>
            <Modal
                id="delete"
                show={visible}
                onHide={() => setDeleteData(null)}
                size="md"
            >
                <Modal.Header closeButton>
                    <h2 className="card-title">Delete Padilabel</h2>
                </Modal.Header>
                <Modal.Body>
                    <h6 className="my-2">Are you sure you want to delete this padilabel?</h6>
                    <br />
                    <br />
                    <p>Label: {deleteData?.label}</p>
                    <p>Path: {deleteData?.path}</p>
                    <p>URL: {deleteData?.url}</p>
                    <p>Roles: {Array.isArray(deleteData?.roles) ? deleteData.roles.join(", ") : ""}</p>
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

export default DeletePadilabel;
