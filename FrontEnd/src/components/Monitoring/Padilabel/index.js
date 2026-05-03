import { useEffect, useState } from "react";
import AddPadilabel from "./Add";
import ListPadilabels from "./List";
import apis from "../../../services/apis";
import EditPadilabel from "./Edit";
import DeletePadilabel from "./Delete";

const PadilabelManagement = () => {
    const [data, setData] = useState([]);
    const [editData, setEditData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        apis.padilabels.getAll()
            .then((response) => {
                setData(response.data);
            })
            .catch((error) => {
                console.error("Error fetching padilabels:", error);
            });
    }

    return (
        <div>
            <AddPadilabel refresh={fetchData} />
            <EditPadilabel refresh={fetchData} editData={editData} setEditData={setEditData} visible={!!editData} />
            <DeletePadilabel refresh={fetchData} deleteData={deleteData} setDeleteData={setDeleteData} visible={!!deleteData} />
            <div className="mt-5">
                <ListPadilabels
                    data={data}
                    setEditData={setEditData}
                    setDeleteData={setDeleteData}
                />
            </div>
        </div>
    );
};

export default PadilabelManagement;
