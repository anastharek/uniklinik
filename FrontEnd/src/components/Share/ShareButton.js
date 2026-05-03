import ModalShareButton from './ModalShareButton'
import React from 'react'

export class ShareButton extends React.Component {

  state = {
    show: false
  }

  openModify = () => {
    this.setState({show: true})
  }

  render () {
    return this.props.StudyInstanceUID ? (
      <>
        <button className='dropdown-item bg-green' type='button'
                onClick={this.openModify}>Share
        </button>
        <ModalShareButton
          show={this.state.show}
          onHide={() => this.setState({show: false})}
          modify={() => this.modify()}
          StudyInstanceUID={this.props.StudyInstanceUID}
        />
      </>
    ) : null
  }
}