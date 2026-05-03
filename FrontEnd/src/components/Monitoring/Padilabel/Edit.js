import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Select from "react-select";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const EditPadilabel = ({ refresh, visible, editData, setEditData }) => {
    const [padilabel, setPadilabel] = useState({
        label: "",
        path: "",
        url: "",
    });
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const roles = await apis.role.getRoles();
            const options = roles.map(role => ({
                value: role.name,
                label: role.name
            }));
            setRoleOptions(options);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    useEffect(() => {
        if (editData) {
            setPadilabel({
                label: editData.label || "",
                path: editData.path || "",
                url: editData.url || "",
            });
            
            // Convert roles array to select options format
            const rolesArray = Array.isArray(editData.roles) ? editData.roles : [];
            const selectedOptions = rolesArray.map(role => ({
                value: role,
                label: role
            }));
            setSelectedRoles(selectedOptions);
        }
    }, [editData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPadilabel((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert selected roles to array of strings
        const rolesArray = selectedRoles.map(role => role.value);

        const dataToSubmit = {
            label: padilabel.label,
            path: padilabel.path,
            url: padilabel.url,
            roles: rolesArray,
        };

        apis.padilabels.update(editData.id, dataToSubmit)
            .then((response) => {
                setEditData(null);
                setPadilabel({
                    label: "",
                    path: "",
                    url: "",
                });
                setSelectedRoles([]);
                toast.success("Padilabel updated successfully");
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "Error updating padilabel");
                console.clear();
            }).finally(refresh);
    }

    return (
        <>
            <Modal
                id="edit"
                show={visible}
                onHide={() => setEditData(null)}
                size="md"
            >
                <Modal.Header closeButton>
                    <h2 className="card-title">Edit Padilabel</h2>
                </Modal.Header>
                <Modal.Body>
                    <fieldset className="mt-3">
                        <label>Label*</label>
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Label"
                            name="label"
                            value={padilabel.label}
                            onChange={handleChange}
                            required
                        />
                    </fieldset>
                    <fieldset className="mt-3">
                        <label>Path*</label>
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Path"
                            name="path"
                            value={padilabel.path}
                            onChange={handleChange}
                            required
                        />
                    </fieldset>
                    <fieldset className="mt-3">
                        <label>URL*</label>
                        <input
                            className="form-control"
                            type="text"
                            placeholder="URL"
                            name="url"
                            value={padilabel.url}
                            onChange={handleChange}
                            required
                        />
                    </fieldset>
                    <fieldset className="mt-3">
                        <label>Roles</label>
                        <Select
                            isMulti
                            options={roleOptions}
                            value={selectedRoles}
                            onChange={setSelectedRoles}
                            placeholder="Select roles..."
                            className="react-select"
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

export default EditPadilabel;
