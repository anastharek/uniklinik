import ModalCardShareButtonDownloadLight from "./ModalCardShareButtonDownloadLight";
import React from "react";
import activity from "../../services/activity";

export class CardShareButtonDownloadLight extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
    activity.create_activity(
      "CREATE SHARE CARD",
      "Share Card with Download (Light)"
    );
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
          QR Share Card (For US or X-RAY) {/*tukar nama */}
        </button>
        <ModalCardShareButtonDownloadLight
          show={this.state.show}
          onHide={() => this.setState({ show: false })}
          modify={() => this.modify()}
          StudyInstanceUID={this.props.StudyInstanceUID}
          orthancID={this.props.orthancID}
          pname={this.props.pname}
          pid={this.props.pid}
          {...this.props}
        />
      </>
    ) : null;
  }
}
