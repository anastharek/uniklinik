import React, { useEffect, useState } from "react";
import { Col, Nav, Navbar, Row } from "react-bootstrap";
import AddItem from "./AddItem";
import AddItemExcel from "./AddItemExcel";
import Manufacture from "./Manufacture";
import Vendor from "./Vendor";
import Location from "./Location";
import Category from "./Category";
import InventoryOverview from "./InventoryOverview";
import InventoryActivity from "./InventoryActivity";
import UsedItem from "./UsedItem";
// import MyDashboard from "./MyDashboard";
// import Profile from "./Profile";
// import PacAdmin from "./PacAdmin";
import { useSelector } from "react-redux";
import UseInventory from "../UsedItemPage";
import Summary from "./Summary";
/**
 * Root Panel of Monitor route
 * Using React Hooks
 */

const InventoryMonitoringRoot = () => {
  const [selectedOptionMenu, setSelectedOptionMenu] = useState("");
  const roles = useSelector((state) => state.PadiMedical.roles);
  const [showMaintance, setMaintance] = useState(false);

  useEffect(() => {
    setSelectedOptionMenu("Profile");
  }, []);
  function clickHandler(event) {
    setSelectedOptionMenu(event.target.value);
  }

  function getComponentToDisplay() {
    switch (selectedOptionMenu) {
      case "InventoryOverview":
        return <InventoryOverview />;
      case "Add_Item":
        return <AddItem />;
      case "Add_Item_Excel":
        return <AddItemExcel />;
      case "Category":
        return <Category />;
      case "Manufacture":
        return <Manufacture />;
      case "Vendor":
        return <Vendor />;
      case "StoreLocation":
        return <Location />;
      case "UsedItem":
        return <UsedItem />;
      case "UseInventory":
        return <UseInventory />;
      case "InventoryActivity":
        return <InventoryActivity />;
      case "Summary":
        return <Summary/>;
      default:
        return <InventoryOverview />;
    }
  }

  const toggleShowMaintance = () => {
    setMaintance((prev) => !prev);
  };
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
            {roles.use_inventory && (
              <Nav className="me-auto mb-3 d-flex align-items-center">
                <button
                  id="icoGeneral"
                  type="button"
                  value="UseInventory"
                  onClick={clickHandler}
                  className="sub-btn-admin"
                >
                  <i className="fas fa-arrow-circle-right pe-2"></i>
                  Use Inventory
                </button>
              </Nav>
            )}
              <Nav className="me-auto mb-3 d-flex align-items-center">
                <button
                  id="icoGeneral"
                  type="button"
                  value="Summary"
                  onClick={clickHandler}
                  className="sub-btn-admin"
                >
                  <i className="fas fa-arrow-circle-right pe-2"></i>
                   Summary
                </button>
              </Nav>
            <Nav className="me-auto mb-3 d-flex align-items-center">
              <button
                id="icoGeneral"
                type="button"
                value="InventoryOverview"
                onClick={clickHandler}
                className="sub-btn-admin"
              >
                <i className="fas fa-arrow-circle-right pe-2"></i>
                Inventory Overview
              </button>
            </Nav>
            <Nav
              style={{ display: roles.view_maintance ? "flex" : "none" }}
              className="me-auto mb-3  align-items-center"
            >
              <button
                id="icoGeneral"
                type="button"
                value="Add_Item"
                onClick={toggleShowMaintance}
                className="sub-btn-admin"
              >
                <i
                  className={`fas fa-arrow-circle-${
                    showMaintance ? "down" : "right"
                  } pe-2`}
                ></i>
                Maintance
              </button>
            </Nav>
            {showMaintance && (
              <ul style={{ width: "100%", display: "block" }}>
                <Nav className="me-auto mb-3 d-flex ">
                  <button
                    id="icoGeneral"
                    type="button"
                    style={{ textAlign: "right" }}
                    className="sub-btn-admin"
                    value="Add_Item"
                    onClick={clickHandler}
                  >
                    Add Item
                  </button>
                </Nav>
                <Nav className="me-auto mb-3 d-flex ">
                  <button
                    id="icoGeneral"
                    type="button"
                    style={{ textAlign: "right" }}
                    className="sub-btn-admin"
                    onClick={clickHandler}
                    value="Add_Item_Excel"
                  >
                    Add Item (Excel)
                  </button>
                </Nav>
                <Nav className="me-auto mb-3 d-flex ">
                  <button
                    id="icoGeneral"
                    type="button"
                    style={{ textAlign: "right" }}
                    className="sub-btn-admin"
                    value="Category"
                    onClick={clickHandler}
                  >
                    Category
                  </button>
                </Nav>
                {roles.view_manufacture && (
                  <Nav className="me-auto mb-3 d-flex">
                    <button
                      id="icoGeneral"
                      type="button"
                      style={{ textAlign: "right" }}
                      className="sub-btn-admin"
                      value="Manufacture"
                      onClick={clickHandler}
                    >
                      Manufacture
                    </button>
                  </Nav>
                )}

                {roles.view_vendor && (
                  <Nav className="me-auto mb-3 d-flex ">
                    <button
                      id="icoGeneral"
                      type="button"
                      style={{ textAlign: "right" }}
                      className="sub-btn-admin"
                      value="Vendor"
                      onClick={clickHandler}
                    >
                      Vendor
                    </button>
                  </Nav>
                )}

                {roles.view_store_location && (
                  <Nav className="me-auto mb-3 d-flex ">
                    <button
                      id="icoGeneral"
                      type="button"
                      style={{ textAlign: "right" }}
                      className="sub-btn-admin"
                      value="StoreLocation"
                      onClick={clickHandler}
                    >
                      Store Location
                    </button>
                  </Nav>
                )}

                <Nav className="me-auto mb-3 d-flex ">
                  <button
                    id="icoGeneral"
                    type="button"
                    style={{ textAlign: "right" }}
                    className="sub-btn-admin"
                    value="UsedItem"
                    onClick={clickHandler}
                  >
                    Used Item Activity
                  </button>
                </Nav>
                <Nav className="me-auto mb-3 d-flex ">
                  <button
                    id="icoGeneral"
                    type="button"
                    style={{ textAlign: "right" }}
                    className="sub-btn-admin"
                    value="InventoryActivity"
                    onClick={clickHandler}
                  >
                    Inventory Activity
                  </button>
                </Nav>
              </ul>
            )}
          </nav>
        </Navbar>
      </Col>
      <Col sm={9} className="ps-md-5">
        {getComponentToDisplay()}
      </Col>
    </Row>
  );
};

export default InventoryMonitoringRoot;
