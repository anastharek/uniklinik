import ModalCardShareButton from "./ModalCardShareButton";
import React from "react";

export class CardShareButton extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
  };

  render() {
    return this.props.StudyInstanceUID ? (
      <>
        <button
          className="dropdown-item bg-green"
          type="button"
          onClick={this.openModify}
        >
          Share card
        </button>
        <ModalCardShareButton
          show={this.state.show}
          onHide={() => this.setState({ show: false })}
          modify={() => this.modify()}
          StudyInstanceUID={this.props.StudyInstanceUID}
          pname={this.props.pname}
          pid={this.props.pid}
        />
      </>
    ) : null;
  }
}
