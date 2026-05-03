import ModalCardShareButtonDownload from "./ModalCardShareButtonDownload";
import React from "react";
import activity from "../../services/activity";
export class CardShareButtonDownload extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
    activity.create_activity("CREATE SHARE CARD", "Share Card with Download");
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
          QR Share Card (For CT or MRI) {/*tukar nama */}
        </button>
        <ModalCardShareButtonDownload
          show={this.state.show}
          onHide={() => this.setState({ show: false })}
          modify={() => this.modify()}
          StudyInstanceUID={this.props.orthancID}
          pname={this.props.pname}
          pid={this.props.pid}
        />
      </>
    ) : null;
  }
}
