import React, { Component, Fragment } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import apis from "../../../services/apis";
import Modal from "react-bootstrap/Modal";
import Metadata from "../../Metadata/Metadata";
import Modify from '../../Modify/Modify'
import { toast } from "react-toastify";
import CreateDicom from "../../CreateDicom/CreateDicom";
import CreateNewStudy from "../../CreateNewStudy/CreateNewStudy";
import { CreateReportButton } from "../../CreateReport/CreateReportButton";
import { ShareButton } from "../../Share/ShareButton";
import { CardShareButton } from "../../CardShare/CardShareButton";
import { CardShareButtonPremium } from "../../CardShare/CardShareButtonPremium";
import OhifLink from "../../Viewers/OhifLink";
import { CardShareButtonWSI } from "../../CardShare/CardShareButtonWSI";
import { CardShareButtonDownload } from "../../CardShare/CardShareButtonDownload";
import { CardShareButtonDownloadLight } from "../../CardShare/CardShareButtonDownloadLight";
import { connect } from "react-redux";

class ActionBouton extends Component {
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

  delete = async () => {
    let orthancID = this.props.orthancID;
    switch (this.props.level) {
      case "patients":
        try {
          await apis.content.deletePatient(orthancID);
          toast.success("Patient " + orthancID + " have been deleted");
          this.props.onDelete(orthancID, this.props.parentID);
        } catch (error) {
          toast.error(error);
        }
        break;
      case "studies":
        try {
          await apis.content.deleteStudies(orthancID);
          toast.success("Studies " + orthancID + " have been deleted");
          this.props.onDelete(orthancID, this.props.parentID);
        } catch (error) {
          toast.error(error);
        }
        break;
      case "series":
        try {
          await apis.content.deleteSeries(orthancID);
          toast.success("Series " + orthancID + " have been deleted");
          this.props.onDelete(orthancID, this.props.parentID);
        } catch (error) {
          toast.error(error);
        }
        break;
      default:
        toast.error("Wrong level");
    }
  };

  handleClick = (e) => {
    e.stopPropagation();
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
            variant="button-dropdown-green"
            id="dropdown-basic"
            className={"button-dropdown button-dropdown-green "+this.props.impClass}
          >
           {this.props.btnLable || 'Select'} 
          </Dropdown.Toggle>

          <Dropdown.Menu className="mt-2 border border-dark border-2">
            {/* hide by rishabh */}
            {/* <OhifLink className='dropdown-item bg-green' {...this.props} /> */}
            {/* changes done by rishabh */}
            {this.props.roles.view_ohif && <OhifLink className='dropdown-item bg-green' {...this.props} />}
            {/* this.props.hideOsimisViewer ? null : <StoneLink className='dropdown-item bg-green' {...this.props} /> */}
            <button
              className="dropdown-item bg-green"
              type="button"
              onClick={this.setMetadata}
              hidden={this.props.hiddenMetadata}
            >
              View Metadata
            </button>
            {["patients", "studies"].includes(this.props.level) ? (
              <CreateDicom {...this.props} />
            ) : null}
            {this.props.roles.modify && 
            <Modify hidden={this.props.hiddenModify} {...this.props} />
            }
            {this.props.roles.create_report && (
              <CreateReportButton {...this.props} />
            )}
            {this.props.roles.create_new_study && (
              <CreateNewStudy {...this.props} />
            )}
            {this.props.roles.sharing && <ShareButton {...this.props} />}
            {this.props.roles.card_sharing && (
              <CardShareButton {...this.props} />
            )}
            {this.props.roles.premium && (
              <CardShareButtonPremium {...this.props} />
            )}{" "}
            {/*tukar*/}
            {this.props.roles.share_card_download && (
              <CardShareButtonDownload {...this.props} />
            )}
            {this.props.roles.share_card_wsi && (
              <CardShareButtonWSI {...this.props} />
            )}
            {this.props.roles.view_and_download_light && (
              <CardShareButtonDownloadLight {...this.props} />
            )}
            <button
              className="dropdown-item bg-red"
              type="button"
              hidden={this.props.hiddenDelete}
              onClick={this.delete}
            >
              Delete
            </button>
          </Dropdown.Menu>
        </Dropdown>
      </Fragment>
    );
  };
}

const mapStateToProps = (state) => {
  return {
    roles: state.PadiMedical.roles,
  };
};

export default connect(mapStateToProps)(ActionBouton);
