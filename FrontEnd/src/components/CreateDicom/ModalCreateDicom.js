import React, {Component} from 'react'
import Modal from 'react-bootstrap/Modal'
import CreateDicom from '../Import/CreateDicom'

export default class ModalCreateDicom extends Component {

    render = () => {
        return (
            <Modal show={this.props.show}  backdrop="static" keyboard={false} onHide={this.props.onHide} onClick={(e) => e.stopPropagation()} size='xl'>
                <Modal.Header closeButton>
                    <Modal.Title>Dicom Converter</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CreateDicom
                        OrthancID={this.props.OrthancID}
                        level={this.props.level}
                    />
                </Modal.Body>
            </Modal>
        )
    }
}
