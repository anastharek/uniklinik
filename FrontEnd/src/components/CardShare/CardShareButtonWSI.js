import ModalCardShareButton from "./ModalCardShareButtonWSI";
import React from "react";

export class CardShareButtonWSI extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
  };

  render() {
    return this.props.orthancID ? (
      <>
        <button
          className="dropdown-item bg-green"
          type="button"
          onClick={this.openModify}
        >
          Share Card WSI
        </button>
        <ModalCardShareButton
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
