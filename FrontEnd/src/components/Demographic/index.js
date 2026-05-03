import React, { useEffect, useState } from "react";
import { Col, Nav, Navbar, Row } from "react-bootstrap";
import Registration from "./Registration/Registration";
import Appointment from "./Appointment/Appointment";
import Examination from "./Examination/Examination";
import { useSelector } from "react-redux";
import UseInventory from "../UsedItemPage";
/**
 * Root Panel of Monitor route
 * Using React Hooks
 */

const Demographic = () => {
  const [selectedOptionMenu, setSelectedOptionMenu] = useState("Registration");
  const roles = useSelector((state) => state.PadiMedical.roles);
  const [showMaintance, setMaintance] = useState(false);

  useEffect(() => {
    setSelectedOptionMenu(
      roles.can_register_patient?"Registration":"Appointment");
  }, []);

  function clickHandler(event) {
    setSelectedOptionMenu(event.target.value);
  }

  function getComponentToDisplay() {
    switch (selectedOptionMenu) {
      case "Registration":
        return roles.can_register_patient?<Registration />:<></>;
      case "Appointment":
        return <Appointment />;
      case "Examination":
        return <Examination />;
      default:
        return roles.can_register_patient?<Registration />:<></>;
    }
  }

  return (
    <Row>
      <Col sm={2} className="border-end border-2">
        <Navbar
          className="d-flex flex-row d-flex justify-content-start align-items-center"
          collapseOnSelect
          expand="lg"
          variant="dark"
        >
          <Navbar.Toggle />
          <nav className="d-flex flex-column text-justify justify-content-start align-items-center">
           {roles.can_register_patient &&<Nav
              className="me-auto mb-3  align-items-center"
            >
              <button
                id="icoGeneral"
                type="button"
                value="Registration"
                onClick={clickHandler}
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Registration"
                    ? " sub-btn-admin-active"
                    : "")}
              >
                Registration
              </button>
            </Nav>}
            
            {roles.can_view_appointment &&
             <Nav
             className="me-auto mb-3  align-items-center"
           >
             <button
               id="icoGeneral"
               type="button"
               value="Appointment"
               onClick={clickHandler}
               className={
                 "sub-btn-admin" +
                 (selectedOptionMenu === "Appointment"
                   ? " sub-btn-admin-active"
                   : "")}
             >
               Appointment
             </button>
          
           </Nav>
            }
           
           
            <Nav
              className="me-auto mb-3  align-items-center"
            >
              <button
                id="icoGeneral"
                type="button"
                value="Examination"
                onClick={clickHandler}
                className={
                  "sub-btn-admin" +
                  (selectedOptionMenu === "Examination"
                    ? " sub-btn-admin-active"
                    : "")}
              >
                Examination
              </button>
            </Nav>

          </nav>
        </Navbar>
      </Col>
      <Col sm={10} className="ps-md-5">
        {getComponentToDisplay()}
      </Col>
    </Row>
  );
};

export default Demographic;
