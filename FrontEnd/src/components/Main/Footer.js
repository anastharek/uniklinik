import React, { Component, Fragment } from 'react'
import Modal from 'react-bootstrap/Modal'
import packageInfo from '../../../package.json'

export default class Footer extends Component {

  state = { show: false }

  render = () => {
    return (
      <Fragment>
        <div className="footer text-center mb-3">
              
              <button type="button" className='link-button ms-3 footer-text' onClick={() => this.setState(prevState => ({ show: !prevState.show }))}>
                <span className="me-3">iPadi v4.3</span>About
              </button>
        </div>
        <div className='text-center'>
              Disclaimer : Not optimal to view angiography study. 
        </div>

        <Modal show={this.state.show} onHide={() => this.setState({ show: false })}>
          <Modal.Header closeButton >
            About
          </Modal.Header>
          <Modal.Body >
            <pre>
              iPadi version 4.3{'\n\n'}
            </pre>

          </Modal.Body>
        </Modal>
      </Fragment>
    )
  }

}