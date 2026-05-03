import { useEffect ,useState} from "react";
import { Modal, Row, Col } from "react-bootstrap";
import apis from "../../../services/apis";
import { toast } from "react-toastify";

const ReportTemplateTable = ({setMode,setSelectedTemplate}) => {
    const [templates,setTemplates] = useState([]);
    const [deleteId,setDeleteId] = useState(null);

    useEffect(()=>{
        fetchTemplate();
    },[])

    const fetchTemplate=()=>{
        apis.reportTemplate.getAll()
        .then(data=>{
            setTemplates(data);
        })
    }
   
    const deleteTemplate=(id)=>{
        apis.reportTemplate.delete(id)
        .then(res=>{
            toast.success("Template Deleted Successfully");
        }).catch(err=>{
            toast.error("Something went wrong");
        })
        .finally(()=>{
            fetchTemplate();
            setDeleteId(null);
        })
    }
 return(
    <>
    <Modal  show={deleteId} onHide={()=>setDeleteId(null)} size='sm'>
        <Modal.Header closeButton>
            <h5 className='card-title'>Delete Report Template</h5>
        </Modal.Header>
        <Modal.Body className="text-center">
           <b> Are You sure to delete template ?</b>
        </Modal.Body>
        <Modal.Footer>
            <Row className="text-center mt-2">
                <Col>
                    <button type='button' className='otjs-button otjs-button-blue'
                        onClick={() => setDeleteId(null)}>Close
                    </button>
                </Col>
                <Col>
                    <button type='button' className='otjs-button otjs-button-red' onClick={()=>deleteTemplate(deleteId)}>Delete</button>
                </Col>
            </Row>
        </Modal.Footer>
    </Modal>
    <div style={{ height: 500, overflow: "hidden", zIndex: 9999 }}>
        <div style={{ height: 500, overflowY: "scroll" }}>
          <table class="table table-striped">
            <thead
              style={{ position: "static", top: "0px" }}
              class="thead-dark"
            >
              <tr>
                <th>Sr No.</th>
                <th>Topic </th>
                <th>Created At</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((data, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <b>{data.name}</b>
                  </td>
                  <td>{new Date(data.createdAt).toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={()=>{
                        setSelectedTemplate(data.id);
                        setMode('edit');
                    }} className="btn btn-primary">Edit</button>
                  </td>
                  <td>
                    <button type="button" onClick={()=>setDeleteId(data.id)} className="btn btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
 )
}
export default ReportTemplateTable;