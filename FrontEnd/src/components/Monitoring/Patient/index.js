import { useEffect, useState } from "react";
import AddPatient from "./Add";
import ListPatients from "./List";
import apis from "../../../services/apis";
import EditPatient from "./Edit";
import DeletePatient from "./Delete";
const PatientRegistration = () => {
    const [data, setData] = useState([]);
    const [editData, setEditData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
      apis.patients.getAll()
        .then((response) => {
            setData(response.data);
        })
        .catch((error) => {
            console.error("Error fetching patients:", error);
        });
    }

    return (
        <div>
            <AddPatient refresh={fetchData}/>
            <EditPatient refresh={fetchData} editData={editData} setEditData={setEditData} visible={!!editData} />
            <DeletePatient refresh={fetchData} deleteData={deleteData} setDeleteData={setDeleteData} visible={!!deleteData} />
            <div className="mt-5">
            <ListPatients data={data} 
            setEditData={setEditData} 
            setDeleteData={setDeleteData}
            />
            </div>
        </div>
    );
};

export default PatientRegistration;
