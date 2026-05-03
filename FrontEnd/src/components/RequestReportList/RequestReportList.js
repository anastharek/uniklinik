import React, { Component, Fragment, useState, useEffect } from 'react'
import { Modal, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import RequestTable from './RequestTable';
import { useSelector } from 'react-redux';
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ExportExcel = (data) => {
    return (
        <ExcelFile element={<button style={{ width: 'max-content' }} className='otjs-button otjs-button-green'>Export/Download</button>}>
            <ExcelSheet data={data.data} name="Employees">
                <ExcelColumn label="Patient Name" value="patient_name" />
                <ExcelColumn label="Patient ID" value="patient_id" />
                <ExcelColumn label="Accesion" value="accessor" />
                <ExcelColumn label="Request Date" value={"createdAt"} />
                <ExcelColumn label="Study Type" value={"study_type"} />
                <ExcelColumn label="Study Date" value={"study_date"} />
                <ExcelColumn label="Request Type" value={"request_type"} />
                <ExcelColumn label="Request By" value={"req_by"} />
                <ExcelColumn label="Indication" value={"text"} />
                <ExcelColumn label="Department" value={"department"} />
                <ExcelColumn label="Status" value={"status"} />
                <ExcelColumn label="Reporter" value={"reporter"} />
            </ExcelSheet>
        </ExcelFile>
    )
}

const RequestReportList = () => {
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
            let data = await (await fetch('/api/request-report/get-all')).json();
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
        fetch('/api/request-report', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: 'delete',
            body: JSON.stringify({ studyid: deleteId })
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

    const updateStatus = (studyid, status) => {
        fetch('/api/request-report', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: 'PUT',
            body: JSON.stringify({ studyid, status, reporter: ((roles?.lastname ? roles?.lastname : '') + ' ' + (roles?.firstname ? roles.firstname : '')) })
        })
            .then(() => {
                getRequest();
            })
    }



    return (
        <Fragment>
            <Row className='d-flex justify-content-between flex-row'>
                <h2 style={{ width: 'max-content' }} className='d-flex card-title'>Requested Reports</h2>
                <div style={{ maxWidth: 150, }}>
                    <ExportExcel key={Math.random()} data={data?.request} />
                </div>

            </Row>
            <Row className="mt-3">
                <Col>
                    <RequestTable users={data.request} roles={data.roles}
                        setDelete={(username, userId) => {
                            setData({
                                username,
                                userId,
                                showDelete: true
                            })
                        }} updateStatus={updateStatus} deleteRequest={deleteRequest} />
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

export default RequestReportList;