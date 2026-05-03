import React, { useEffect, useState } from "react";
import { Col, Nav, Navbar, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import CreateDataset from "./CreateDataset";
import MyDatasetTab from "./MyDatasetTab";
import SubscribeDataset from "./SubscribeDataset";
import DatasetRequests from "./DatasetRequests";


const MyDataset = () => {
  const [selectedOptionMenu, setSelectedOptionMenu] = useState("");
  const roles = useSelector((state) => state.PadiMedical.roles);

  useEffect(() => {
    setSelectedOptionMenu("subscribe");
  }, []);
  function clickHandler(event) {
    setSelectedOptionMenu(event.target.value);
  }

  function getComponentToDisplay() {
    switch (selectedOptionMenu) {
      case "create-dataset":
        return <CreateDataset />;
      case "my-dataset":
        return <MyDatasetTab />;
      case "subscribe":
        return <SubscribeDataset />;
      case "dataset-request":
        return <DatasetRequests/>;
      default:
        return [];
    }
  }

  return (
    <Row>
      <Col sm={3} className="border-end border-2">
        <Navbar
          className="d-flex flex-row d-flex justify-content-start align-items-center"
          collapseOnSelect
          expand="lg"
          variant="dark"
        >
          <Navbar.Toggle />

          <nav className="d-flex flex-column text-justify justify-content-start align-items-center">
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="subscribe"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "subscribe"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                Subscribed
              </button>
            </Nav>
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="my-dataset"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "my-dataset"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                My Datasets
              </button>
            </Nav>
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="dataset-request"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "dataset-request"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                Request
              </button>
            </Nav>
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="create-dataset"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "create-dataset"
                    ? " sub-btn-admin-active"
                    : "")
                }
                hidden={!roles.create_dataset}
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
               Create Dataset
              </button>
            </Nav>
          </nav>
        </Navbar>
      </Col>
      <Col sm={9} className="ps-5">
        {getComponentToDisplay()}
      </Col>
    </Row>
  );
};

export default MyDataset;
