import ModalCardShareButton from "./ModalCardShareButton";
import React from "react";
import ModalCardShareUpload from "./ModalCardShareUpload";

export class CardShareButtonUpload extends React.Component {
  state = {
    show: false,
  };

  openModify = () => {
    this.setState({ show: true });
  };

  render() {
    return (this.props?.username && this.props?.password) ? (
      <>
        <button
          style={{padding:'10px 15px',width:'max-content',background:'#4CBC29'}}
          className="button-dropdown  btn "
          type="button"
          onClick={this.openModify}
        >
          Uploader Card
        </button>
        <ModalCardShareUpload
          show={this.state.show}
          onHide={() => this.setState({ show: false })}
          modify={() => this.modify()}
          username={this.props.username}
          password={this.props.password}
        />
      </>
    ) : null;
  }
}
