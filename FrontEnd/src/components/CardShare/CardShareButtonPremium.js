import ModalCardShareButton from "./ModalCardShareButton";
import React from "react";
import activity from "../../services/activity";

export class CardShareButtonPremium extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
    activity.create_activity("CREATE SHARE CARD", "Share card Premium");
  };

  render() {
    //  console.log(this.props);
    return this.props.StudyInstanceUID ? (
      <>
        <button
          className="dropdown-item bg-green"
          type="button"
          onClick={this.openModify}
        >
          Share card Premium
        </button>
        <ModalCardShareButton
          show={this.state.show}
          onHide={() => this.setState({ show: false })}
          modify={() => this.modify()}
          StudyInstanceUID={this.props.orthancID}
          pname={this.props.pname}
          pid={this.props.pid}
          orthanc={true}
        />
      </>
    ) : null;
  }
}
