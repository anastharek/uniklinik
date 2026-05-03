import ModalCreateReport from './ModalCreateReport'
import React from 'react'

export class CreateReportButton extends React.Component {

  state = {
    show: false
  }

  openModify = () => {
    this.setState({show: true})
  }

  render () {
    return (
      <>
        <button className='dropdown-item bg-green' type='button'
                onClick={this.openModify}>Create study
        </button>
        <ModalCreateReport
          show={this.state.show}
          onHide={() => this.setState({show: false})}
          modify={() => this.modify()}
          OrthancID={this.props.orthancID}
          level={this.props.level}
        />
      </>
    )
  }
}