import React, { Component, Fragment } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import apis from "../../../services/apis";

import OhifLink from "../../Viewers/OhifLink";
import StoneLink from "../../Viewers/StoneLink";
import Modal from "react-bootstrap/Modal";
import Metadata from "../../Metadata/Metadata";
import Modify from "../../Modify/Modify";
import { toast } from "react-toastify";
import CreateDicom from "../../CreateDicom/CreateDicom";
import { CreateReportButton } from "../../CreateReport/CreateReportButton";
import { ShareButton } from "../../Share/ShareButton";
import { CardShareButton } from "../../CardShare/CardShareButton";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
//this file is created by rishabh 11/05/22 IST @coderrishabhdubey@gmail.com

class ActionBoutonView extends Component {
  state = {
    showMetadata: false,
  };

  static defaultProps = {
    hiddenMetadata: true,
    hiddenCreateDicom: false,
  };

  setMetadata = () => {
    this.setState({
      showMetadata: !this.state.showMetadata,
    });
  };

  handleClick = (e) => {
    e.stopPropagation();
  };

  openWSI = (e) => {
    let study_id = this.props.osimis_link.split("study=")[1];
    if (study_id) {
      fetch("/api/studies/" + study_id, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((res) => {
          let url =
            "https://strokesvr.padimedical.com/wsi/app/viewer.html?series=" +
            res?.Series?.[0];
            e.preventDefault();
            localStorage.setItem('temp-link',url) 
            window.open("/external-page","_blank")
          // window.open(url, "_blank").focus();
        });
    }
  };

  render = () => {
    return (
      <Fragment>
        {/*modal pour metadata*/}
        <Modal
          show={this.state.showMetadata}
          onHide={this.setMetadata}
          scrollable={true}
        >
          <Modal.Header closeButton>
            <Modal.Title>Metadata</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Metadata serieID={this.props.orthancID} />
          </Modal.Body>
        </Modal>

        <Dropdown
          onClick={this.handleClick}
          drop="left"
          className="text-center"
        >
          <Dropdown.Toggle
            style={{ background: "#4CBCD2" }}
            variant="button-dropdown btn otjs-button otjs-button-blue"
            id="dropdown-basic"
            className="button-dropdown button-dropdown-green"
          >
            View
          </Dropdown.Toggle>
          {/* tukar viewer */}
          <Dropdown.Menu className="mt-2 border border-dark border-2">
            {this.props.role.view_radiant && <Link
              style={{ textDecoration: "none" }}
              onClick={(e)=>{
                e.preventDefault();
                localStorage.setItem('temp-link',this.props.radiant) 
                window.open("/external-page","_blank")
               }}
            >
              <button type="button" className="dropdown-item ">
                RADIANT
              </button>
            </Link>}

            {this.props.role.view_horos && <Link
              style={{ textDecoration: "none" }}
              onClick={(e)=>{
                e.preventDefault();
                localStorage.setItem('temp-link',this.props.osirix) 
                window.open("/external-page","_blank")
               }}
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                HOROS
              </button>
            </Link>}

            {this.props.role.view_osimis && <Link
              style={{ textDecoration: "none" }}
              to={{
                pathname: "/external-page",
                state: { link: this.props.osimis_link },
              }}
              onClick={(e)=>{
               e.preventDefault();
               localStorage.setItem('temp-link',this.props.osimis_link) 
               window.open("/external-page","_blank")
              }}
              target="_blank"
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                OSIMIS Viewer
              </button>
            </Link>}

            {this.props.role.view_wsi && (
              <a
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  this.openWSI(e);
                }}
              >
                <button
                  className="dropdown-item "
                  type="button"
                  hidden={this.props.hiddenDelete}
                >
                  WSI Viewer
                </button>
              </a>
            )}

            {this.props.role.can_download_zip && (
              <Link
                style={{ textDecoration: "none" }}
                onClick={(e)=>{
                  e.preventDefault();
                  localStorage.setItem('temp-link',this.props.downloadzip) 
                  window.open("/external-page","_blank")
                 }}
              >
                <button
                  className="dropdown-item "
                  type="button"
                  hidden={this.props.hiddenDelete}
                >
                  Download ZIP
                </button>
              </Link>
            )}

            {this.props.role.view_aiViewer && <Link
              style={{ textDecoration: "none" }}
              onClick={(e)=>{
                e.preventDefault();
                localStorage.setItem('temp-link',this.props.OhifLink) 
                window.open("/external-page","_blank")
               }}
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                A.I. Viewer
              </button>
            </Link>}
          </Dropdown.Menu>
        </Dropdown>
      </Fragment>
    );
  };
}

const mapStateToProps = (state) => ({
  role: state.PadiMedical.roles,
});

export default connect(mapStateToProps, null)(ActionBoutonView);
