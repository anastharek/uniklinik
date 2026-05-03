import { useEffect, useState } from "react";
import RequestFeatureTable from "./RequestFeatureTable";
import requestFeatureService from "../../services/requestFeature";
import ReactExport from "react-export-excel-fixed-xlsx";
import { toast } from "react-toastify";
import { Modal, Row, Col } from "react-bootstrap";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ExportExcel = ({data}) => {
    return (
      <ExcelFile
        element={
          <button
            style={{ width: "max-content" ,marginLeft:'auto'}}
            className="otjs-button otjs-button-green"
          >
            Export/Download
          </button>
        }
      >
        <ExcelSheet data={data} name="Request-Feature">
          <ExcelColumn label="Patient Name" value="patient_name" />
          <ExcelColumn label="Patient ID" value="patient_id" />
          <ExcelColumn label="Hospital" value="hospital" />
          <ExcelColumn label="Request Date" value={"createdAt"} />
          <ExcelColumn label="Study Type" value={"study_type"} />
          <ExcelColumn label="Study Date" value={"study_date"} />
          <ExcelColumn label="Request Type" value={"request_type"} />
          <ExcelColumn label="Indication" value={"indication"} />
          <ExcelColumn label="Radiologist" value={"radiologist"} />
        </ExcelSheet>
      </ExcelFile>
    );
};
const RequestFeatureListPage = () => {
  const [data, setData] = useState([]);
  const [deleteData,setDeleteData]=useState(null);
  useEffect(()=>{
    fetchData();
  },[])

  const fetchData=()=>{
    requestFeatureService.getList()
    .then(resJson=>setData(resJson))
    .catch(err=>console.log(err))
  }
  const deleteRequest=(tempData)=>{
    setDeleteData(tempData)
  }

  const makeDelete = () => {
    fetch(`api/request-feature/${deleteData.id}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "DELETE",
    }).then(() => {
      fetchData();
      toast.success("Request Removed !!");
      setDeleteData(null);
    });
  };

  return (
    <>
      <div style={{width:'max-content'}} className="my-2 ms-auto">
        <ExportExcel data={data}/>
      </div>
      <RequestFeatureTable deleteRequest={deleteRequest} tableData={data} />
      <Modal show={deleteData} id="delete" size="sm">
        <Modal.Header closeButton>
          <h2 className="card-title">Delete Request Feature</h2>
        </Modal.Header>
        <Modal.Body className="text-center">
          Are You sure to delete ?
        </Modal.Body>
        <Modal.Footer>
          <Row className="text-center mt-2">
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-blue"
                onClick={() => setDeleteData(null)}
              >
                Close
              </button>
            </Col>
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-red"
                onClick={makeDelete}
              >
                Delete
              </button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default RequestFeatureListPage;
