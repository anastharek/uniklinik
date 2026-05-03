import React from 'react'
import { Col, Row } from 'react-bootstrap'
import { CreateReport } from './CreateReport'

export class CreateReportView extends React.Component {
  render() {
    return (
      <div>
        <Row className="pb-3">
          <Col className="d-flex justify-content-start align-items-center">
            <i className="fas fa-file-medical ico me-3"></i><h2 className="card-title">Create study</h2>
          </Col>
        </Row>

        <CreateReport />
      </div>
    )
  }
}