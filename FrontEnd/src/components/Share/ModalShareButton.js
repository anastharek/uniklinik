import React, {Component} from 'react'
import Modal from 'react-bootstrap/Modal'
import { Col, Row } from 'react-bootstrap'
import { QRCode } from 'react-qrcode-logo'
import MD5 from 'crypto-js/md5'

import logo from '../../assets/images/logo-2.jpg'

export default class ModalShareButton extends Component {

  constructor (props) {
    super(props)
    const IDs = this.props.StudyInstanceUID.split('.')
    const slicedPwd = MD5(IDs.pop()).toString()
    this.PWD = slicedPwd.slice(slicedPwd.length - 8)
    this.OHIFLink = `${window.location.protocol}//${window.location.host}/external/ohif/${this.props.StudyInstanceUID}`
    this.StoneLink = `${window.location.protocol}//${window.location.host}/external/stone/${this.props.StudyInstanceUID}`
  }

  render = () => {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onClick={(e) => e.stopPropagation()} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Share</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-dark">
                  <Row style={{ textAlign: 'center' }}>
                    <Col>
                      <h3>OHIF Viewer</h3>
                      <div style={{ cursor: 'pointer' }}
                           onClick={() => navigator.clipboard.writeText(this.OHIFLink)}
                      >
                        <QRCode
                          size={300}
                          logoWidth={200}
                          logoHeight={50}
                          logoOpacity={0.6}
                          value={this.OHIFLink}
                          logoImage={logo}
                        />
                      </div>
                    </Col>
                    <Col>
                      <h3>Stone Viewer</h3>
                      <div style={{ cursor: 'pointer' }}
                           onClick={() => navigator.clipboard.writeText(this.StoneLink)}
                      >
                        <QRCode
                          size={300}
                          logoWidth={200}
                          logoHeight={50}
                          logoOpacity={0.6}
                          value={this.StoneLink}
                          logoImage={logo}
                        />
                      </div>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 24, textAlign: 'center' }}>
                    <p>You can also click on any of those QR codes to copy the access URL.</p>
                  </Row>
                  <Row style={{ marginTop: 24 }}>
                    <h5>The following password is required to view the document: <code>{this.PWD}</code></h5>
                  </Row>
                </Modal.Body>
            </Modal>
        )
    }
}
