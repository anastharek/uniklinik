import React, { Component } from "react";
import button from "react-bootstrap";
import { toast } from "react-toastify";

import apis from "../../services/apis";
import activity from "../../services/activity";

export default class DownloadDropdown extends Component {
  state = {
    buttonText: "Download",
    disabled: false,
  };

  updateProgress = (progress) => {
    this.setState({
      buttonText: "Preparing Zip " + progress + "%",
      disabled: true,
    });
  };

  setStatusDownloading = () => {
    this.setState({
      buttonText: "Downloading",
      disabled: true,
    });
  };

  resetProgress = () => {
    this.setState({
      buttonText: "Download",
      disabled: false,
    });
  };

  handleRootClick = (e) => {
    e.stopPropagation();
  };

  handleClickDownload = async (e) => {
    e.stopPropagation();

    try {
      if (e.currentTarget.id === "hirarchical") {
        apis.exportDicom.downloadZipSync(
          this.props.exportIds,
          this.props.TS,
          false
        );
      } else {
        apis.exportDicom.downloadZipSync(
          this.props.exportIds,
          this.props.TS,
          true
        );
      }
      activity.create_activity("EXPORT", "EXPORTED AS DICOM");
    } catch (error) {
      toast.error(error.statusText);
    }
  };

  render = () => {
    return (
      <button
        type="button"
        className="otjs-button otjs-button-blue w-7"
        onClick={this.handleClickDownload}
        variant="success"
        disabled={this.state.disabled}
        title={this.state.buttonText}
      >
        Download
      </button>
    );
  };
}
