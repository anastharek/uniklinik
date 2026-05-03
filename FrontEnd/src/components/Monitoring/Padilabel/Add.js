import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Select from "react-select";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const AddPadilabel = ({ refresh }) => {
    const [show, setShow] = useState(false);
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
            ...padilabel,
            roles: rolesArray,
        };

        apis.padilabels.create(dataToSubmit)
            .then((response) => {
                setShow(false);
                setPadilabel({
                    label: "",
                    path: "",
                    url: "",
                });
                setSelectedRoles([]);
                toast.success("Padilabel created successfully");
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "Error creating padilabel");
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
                New Padilabel
            </button>
            <Modal
                id="create"
                show={show}
                onHide={() => setShow(prev => !prev)}
                size="md"
            >
                <Modal.Header closeButton>
                    <h2 className="card-title">Create Padilabel</h2>
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
                        Create
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AddPadilabel;
