import { CreateRequestScanSection } from "./CreateRequestScan";
import { Col, Row } from "react-bootstrap";
const CreateRequestScan = () => {
  return (
    <div>
      <Row className="pb-3">
        <Col className="d-flex justify-content-start align-items-center">
          <i className="fas fa-file-medical ico me-3"></i>
          <h2 className="card-title">Create Request For Scan </h2>
        </Col>
      </Row>
      <CreateRequestScanSection />
    </div>
  );
};

export default CreateRequestScan;
