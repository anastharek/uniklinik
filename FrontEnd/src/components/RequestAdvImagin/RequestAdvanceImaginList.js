import React, { Component, Fragment, useState, useEffect } from 'react'
import { Modal, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ImaginTable from './ImaginTable';
import { useSelector } from 'react-redux';

const RequestAdvanceImaginList = () => {
    const [data, setData] = useState({
        username: '',
        request: [],
        roles: [],
        showDelete: false,
    })
    const [deleteId, setDelete] = useState(null);
    const [show, setShow] = useState(false);
    const roles = useSelector(state => state.PadiMedical.roles)

    useEffect(() => {
        getRequest();
    }, [])




    const getRequest = async () => {

        try {
            let data = await (await fetch('/api/request-imagin')).json();
            let final = data.map((element, index) => { return { ...element, No: index + 1, createdAt: new Date(element.createdAt).toLocaleString() } })
            setData(prev => { return ({ ...data, request: final }) })
        } catch (error) {
            toast.error(error.statusText)
        }

    }

    const resetState = () => {
        setData(prev => {
            return ({
                ...prev,
                showDelete: false
            })
        })
        getRequest()
    }



    const makeDelete = () => {
        setShow(false);
        fetch('/api/request-imagin/' + deleteId, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: 'delete',
        })
            .then(() => {

                toast.success('deleted report');
                resetState();
            })
    }
    const deleteRequest = (studyid) => {
        setDelete(studyid)
        setShow(true)
    }




    return (
        <Fragment>
            <Row>
                <h2 className='card-title'>Advance Imaging List</h2>
            </Row>
            <Row className="mt-3">
                <Col>
                    <ImaginTable users={data.request} roles={data.roles}
                        setDelete={(username, userId) => {
                            setData({
                                username,
                                userId,
                                showDelete: true
                            })
                        }} deleteRequest={deleteRequest} />
                </Col>
            </Row>
            <Modal show={show} id='delete' size='sm'>
                <Modal.Header closeButton>
                    <h2 className='card-title'>Delete Report</h2>
                </Modal.Header>
                <Modal.Body className="text-center">
                    Are You sure to delete ?
                </Modal.Body>
                <Modal.Footer>
                    <Row className="text-center mt-2">
                        <Col>
                            <button type='button' className='otjs-button otjs-button-blue'
                                onClick={() => setShow(false)}>Close
                            </button>
                        </Col>
                        <Col>
                            <button type='button' className='otjs-button otjs-button-red' onClick={makeDelete}>Delete</button>
                        </Col>
                    </Row>

                </Modal.Footer>
            </Modal>
        </Fragment>

    );
}

export default RequestAdvanceImaginList;