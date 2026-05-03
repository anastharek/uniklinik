import React, { useEffect, useState } from "react";
import { Col, Nav, Navbar, Row } from "react-bootstrap";
import UserActivity from "./UserActivity";
import SystemMonitoring from "./SystemMonitoring.js";
import MyDashboard from "./MyDashboard";
import Profile from "./Profile";
import PacAdmin from "./PacAdmin";
import Uploader from "./Uploader";
import { useSelector } from "react-redux";
import RegisteredUser from "./Users/index.js";
import DatasetRequest from "./DatasetRequest/index.js";
import ReportTemplate from "./ReportTemplate/index.js";
import PatientManagement from "./Patient";
import PadilabelManagement from "./Padilabel";
/**
 * Root Panel of Monitor route
 * Using React Hooks
 */

const MonitoringRoot = () => {
  const [selectedOptionMenu, setSelectedOptionMenu] = useState("");
  const roles = useSelector((state) => state.PadiMedical.roles);

  useEffect(() => {
    setSelectedOptionMenu("Profile");
  }, []);
  function clickHandler(event) {
    setSelectedOptionMenu(event.target.value);
  }

  function getComponentToDisplay() {
    switch (selectedOptionMenu) {
      case "Profile":
        return <Profile />;
      case "SystemMonitoring":
        return <SystemMonitoring />;
      case "UserActivity":
        return <UserActivity />;
      case "MyDashboard":
        return <MyDashboard />;
      case "PacAdmin":
        return <PacAdmin />;
      case "Uploader":
        return <Uploader />;
      case "Users":
        return <RegisteredUser />;
      case "dataset-req":
        return <DatasetRequest />;
      case "ReportTemplate":
        return <ReportTemplate />;
      case "Patient":
        return <PatientManagement />;
      case "Padilabel":
        return <PadilabelManagement />;

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
                value="Profile"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Profile"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                My Profile
              </button>
            </Nav>
            {roles.view_system_monitoring && (
              <Nav className="me-auto mb-3 d-flex align-items-center">
                <button
                  id="icoGeneral"
                  type="button"
                  value="SystemMonitoring"
                  className={
                    "sub-btn-admin" +
                    (selectedOptionMenu === "SystemMonitoring"
                      ? " sub-btn-admin-active"
                      : "")
                  }
                  onClick={clickHandler}
                >
                  <i className="fas fa-arrow-circle-right pe-2"></i>System
                  Monitoring
                </button>
              </Nav>
            )}
            {roles.view_user_activity && (
              <Nav className="me-auto mb-3 d-flex align-items-center">
                <button
                  id="icoUser"
                  type="button"
                  value="UserActivity"
                  className={
                    "sub-btn-admin" +
                    (selectedOptionMenu === "UserActivity"
                      ? " sub-btn-admin-active"
                      : "")
                  }
                  onClick={clickHandler}
                >
                  <i className="fas fa-arrow-circle-right pe-2"></i>Users
                  Activity
                </button>
              </Nav>
            )}

            {roles.view_my_dashboard && (
              <Nav className="me-auto mb-3 d-flex align-items-center">
                <button
                  id="icoUser"
                  type="button"
                  value="MyDashboard"
                  className={
                    "sub-btn-admin" +
                    (selectedOptionMenu === "MyDashboard"
                      ? " sub-btn-admin-active"
                      : "")
                  }
                  onClick={clickHandler}
                >
                  <i className="fas fa-arrow-circle-right pe-2"></i>My Dashboard
                </button>
              </Nav>
            )}
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="PacAdmin"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "PacAdmin"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                PACS Admin Profile
              </button>
            </Nav>
            {roles.can_view_uploader &&(
              <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="Uploader"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Uploader"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                 Uploader
              </button>
            </Nav>
            )}
            {roles.manage_report_template &&
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="ReportTemplate"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "ReportTemplate"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                Report Template
              </button>
            </Nav>}
            {roles.view_padiLabel &&(
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="Padilabel"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Padilabel"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
               Padi Labels
              </button>
            </Nav>
            )}
            {roles.view_registered_user &&(
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="Users"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Users"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                Registered Users
              </button>
            </Nav>
            )}
            {roles.dataset_request &&(
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="dataset-req"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "dataset-req"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                 Dataset Req.
              </button>
            </Nav>)}
            
            {roles.patient_management &&(
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="Patient"
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Patient"
                    ? " sub-btn-admin-active"
                    : "")
                }
                onClick={clickHandler}
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                  Patient
              </button>
            </Nav>
            )}
          </nav>
        </Navbar>
      </Col>
      <Col sm={9} className="ps-5">
        {getComponentToDisplay()}
      </Col>
    </Row>
  );
};

export default MonitoringRoot;
