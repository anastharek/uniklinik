import { useEffect, useState } from "react";
import RequestScanTable from "./RequestScanTable";
import { Modal, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

const RequestScanList = () => {
  const [data, setData] = useState([]);
  const [show,setShow]=useState(false);
  const [deletedId,setDeletedID]=useState(null);
  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport=()=>{
    fetch("/api/request-scan")
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.log(err));
  }

  const deleteScanConfirm=()=>{
    fetch("/api/request-scan",{
      method:"DELETE",
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
    },
      body:JSON.stringify({id:deletedId})})
    .then((res)=>{
      if(res.status==204){
        toast.success("request scan deleted sucessfully")
        fetchReport();
        setShow(false);
      }else{
        toast.error('something went wrong')
      }
    })
  }
 
  const deleteScan=(id)=>{
    setDeletedID(id)
    setShow(true);
    
  }

  return (
    <>
      <RequestScanTable deleteScan={deleteScan} data={data || []} />
      <Modal show={show}  id="delete" size="sm">
        <Modal.Header closeButton>
          <h2 className="card-title">Delete Report</h2>
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
                onClick={() => setShow(false)}
              >
                Close
              </button>
            </Col>
            <Col>
              <button
                type="button"
                className="otjs-button otjs-button-red"
                onClick={deleteScanConfirm}
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

export default RequestScanList;
