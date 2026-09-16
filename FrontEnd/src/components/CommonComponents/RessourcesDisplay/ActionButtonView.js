import React, { Component, Fragment } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";
import Metadata from "../../Metadata/Metadata";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import activity from "../../../services/activity";
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

  LogActivity = (type) => {
    activity.create_activity(type);
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

          <Dropdown.Menu className="mt-2 border border-dark border-2">
            {/* tukar */}
          {this.props.role.view_radiant && <a
              style={{ textDecoration: "none" }}
              href={this.props.radiant}
              target="_blank"
              onClick={() => this.LogActivity("VIEW RADIANT")}
            >
              <button type="button" className="dropdown-item ">  {/*tukar viewer - disable viewer */}
                RADIANT  
              </button>
    </a>}

           {this.props.role.view_horos && <a
              style={{ textDecoration: "none" }}
              href={this.props.osirix}
              target="_blank"
            >
              <button
                className="dropdown-item "
                type="button"
                onClick={() => this.LogActivity("VIEW HOROS")}
                hidden={this.props.hiddenDelete}
              >
                HOROS
              </button>
  </a>}

           {this.props.role.view_weasis && <a
              style={{ textDecoration: "none" }}
              href={this.props.weasis}
              target="_blank"
              onClick={() => this.LogActivity("VIEW WEASIS")}
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                WEASIS
              </button>
            </a>}

            {this.props.role.view_osimis && <Link
              style={{ textDecoration: "none" }}
              onClick={(e) => {
               e.preventDefault();
               this.LogActivity("VIEW OSIMIS");
               localStorage.setItem('temp-link',this.props.osimis_link) 
               window.open("/external-page","_blank")
              }}
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                OSIMIS Viewer
              </button>
            </Link>}

            {this.props.role.view_wsi && <a
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                this.LogActivity("VIEW WSI")
                this.openWSI(e)}
              }
            
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                WSI Viewer
              </button>
            </a>}
            


            {this.props.role.view_aiViewer &&<Link
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
            {this.props.role.view_ohif && <Link
              style={{ textDecoration: "none" }}
              onClick={(e)=>{
                e.preventDefault();
                this.LogActivity("VIEW OHIF")
                localStorage.setItem('temp-link',this.props.OhifLink) 
                window.open("/external-page","_blank")
               }}
            >
              <button
                className="dropdown-item "
                type="button"
                hidden={this.props.hiddenDelete}
              >
                OHIF Viewer
              </button>
            </Link>}
            {this.props.role.meddream && (
              <Link
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  this.LogActivity("VIEW STONE");
                  localStorage.setItem('temp-link',"https://uniklinikviewer.anzverse.com/stone-webviewer/index.html?study=" +this.props.StudyInstanceUID) 
                  window.open("/external-page","_blank")
                 }}
                target="_blank"
              >
                <button
                  className="dropdown-item "
                  type="button"
                  hidden={this.props.hiddenDelete}
                >
                  OR Viewer (Trial) {/*tukar nama - MedDream (DEMO) to Orthanc Viewer (Trial) */}
                </button>
              </Link>
            )}

            {this.props.role.can_download_zip && (
              <a
                style={{ textDecoration: "none" }}
                href={this.props.downloadzip}
                target="_blank"
                onClick={() => this.LogActivity("DOWNLOAD ZIP")}
              >
                <button
                  className="dropdown-item "
                  type="button"
                  hidden={this.props.hiddenDelete}
                >
                  Download ZIP
                </button>
              </a>
            )}
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
