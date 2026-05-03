import React, { Component, Fragment } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import apis from '../../../services/apis'

import OhifLink from '../../Viewers/OhifLink'
import StoneLink from '../../Viewers/StoneLink'
import Modal from 'react-bootstrap/Modal'
import Metadata from '../../Metadata/Metadata'
import Modify from '../../Modify/Modify'
import { toast } from 'react-toastify'
import CreateDicom from '../../CreateDicom/CreateDicom'
import { CreateReportButton } from '../../CreateReport/CreateReportButton'
import { ShareButton } from '../../Share/ShareButton'
import { CardShareButton } from '../../CardShare/CardShareButton'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import AssignDoctor from '../AssignDoctor/AssignDoctor'
import AssignByRole from '../AssignByRole'
import RequestFeature from '../RequestFeature'
//this file is created by rishabh 17/06/22 IST @coderrishabhdubey@gmail.com

class ActionBoutonReport extends Component {

    state = {
        showMetadata: false,
        isFinalize: undefined,
    }

    static defaultProps = {
        hiddenMetadata: true,
        hiddenCreateDicom: false
    }


    setMetadata = () => {
        this.setState({
            showMetadata: !this.state.showMetadata
        })

    }

    makeCall = () => {
        // fetch(`/api/request-report/${this.props.StudyOrthancID}/is_finalize`)
        //     .then(res => res.json())
        //     .then(res => this.setState({ isFinalize: res }));
        const Options = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ "ids": [this.props.StudyOrthancID] })
        }
        fetch('/api/report-status-by-ids', Options)
            .then(res => res.json())
            .then(res => this.setState({ isFinalize: res[0] }))
    }



    handleClick = (e) => {
        if (this.props.role.view_patient_report && !this.state.isFinalize) this.makeCall()
        e.stopPropagation()
    }

    render = () => {
        return (
            <Fragment>
                {/*modal pour metadata*/}
                <Modal show={this.state.showMetadata} onHide={this.setMetadata} scrollable={true}>
                    <Modal.Header closeButton>
                        <Modal.Title>Metadata</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Metadata serieID={this.props.orthancID} />
                    </Modal.Body>
                </Modal>

                <Dropdown id={this.props.pid} onClick={this.handleClick} drop='left' className="text-center">
                    <Dropdown.Toggle style={{ background: '#F1A630' }} variant="button-dropdown btn otjs-button otjs-button-danger" id="dropdown-basic" className="button-dropdown button-dropdown-green">
                        Report
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="mt-2 border border-dark border-2">
                        {(this.props.role.create_patient_report || this.props.role.edit_patient_report) ?
                            <Link style={{ textDecoration: 'none' }} to={{
                                pathname: this.props.createOrviewLink,
                                pid: this.props.pid,
                                pname: this.props.pname,
                                StudyInstanceUID: this.props.StudyInstanceUID,
                                study_type: this.props.description?.StudyDescription,
                                study_date: this.props.description?.StudyDate,
                                accessor: this.props.accessor,
                                nric:this.props.nric,
                                ReferringPhysicianName:this.props.ReferringPhysicianName,
                            }} >
                                <button className='dropdown-item ' type='button' hidden={this.props.hiddenDelete}
                                    style={{ background: this.props.noReport || this.state.isFinalize === null ? '#eeeeee' : this.state.isFinalize === false ? 'rgb(241, 166, 48)' : null }}
                                >
                                    Create/Edit Report {/*tukar nama - create/edit to create/edit report */}
                                </button>
                            </Link> : null
                        }
                        {this.props.role.view_patient_report ?

                            < Link style={{ textDecoration: 'none', width: 'max-content' }}
                                to={{ pathname: this.props.viewLink, study_date: this.props.description?.StudyDate, StudyInstanceUID: this.props.StudyInstanceUID, }} >
                                <button className={this.state.isFinalize ? 'button-dropdown-green dropdown-item' : 'dropdown-item'} type='button' hidden={this.props.hiddenDelete}
                                >
                                    View Report {/*tukar nama - View to View report */}
                                </button>
                            </Link>

                            : null}

                        {this.props.role.request_patient_report ?
                            <Link style={{ textDecoration: 'none' }} to={{
                                pathname: this.props.requestLink, pid: this.props.pid, pname: this.props.pname,
                                study_type: this.props.description?.StudyDescription,
                                study_date: this.props.description?.StudyDate,
                                accessor: this.props.accessor,
                                StudyInstanceUID: this.props.StudyInstanceUID
                            }}  >
                                <button className='dropdown-item ' type='button' hidden={this.props.hiddenDelete}
                                >
                                    Request report
                                </button>
                            </Link> : null}
                        {this.props.role.can_req_imaging ?
                            <Link style={{ textDecoration: 'none' }} to={{
                                pathname: this.props.reqAdvImagin, pid: this.props.pid, pname: this.props.pname,
                                study_type: this.props.description?.StudyDescription,
                                study_date: this.props.description?.StudyDate,
                            }}  >
                                <button className='dropdown-item ' type='button' hidden={this.props.hiddenDelete}
                                >
                                    Request Advance Imaging
                                </button>
                            </Link> : null}
                        {this.props.role.can_assign_doctors ?
                            <AssignDoctor
                                study_id={this.props.StudyOrthancID}
                                patient_name={this.props.pname}
                                patient_id={this.props.pid}
                                accesor={this.props.accessor}
                                study_type={this.props.description?.StudyDescription}
                                study_date={this.props.description?.StudyDate}
                                StudyInstanceUID={this.props.StudyInstanceUID}
                            /> : null}
                        {this.props.role.can_assign_report_by_role ?
                            <AssignByRole
                                study_id={this.props.StudyOrthancID}
                                patient_name={this.props.pname}
                                patient_id={this.props.pid}
                                accesor={this.props.accessor}
                                study_type={this.props.description?.StudyDescription}
                                study_date={this.props.description?.StudyDate}
                                StudyInstanceUID={this.props.StudyInstanceUID}
                            /> : null}
                          {this.props.role.can_request_feature ?
                            <RequestFeature
                                username={this.props.role.username}
                                study_id={this.props.StudyOrthancID}
                                patient_name={this.props.pname}
                                patient_id={this.props.pid}
                                accesor={this.props.accessor}
                                study_type={this.props.description?.StudyDescription}
                                study_date={this.props.description?.StudyDate}
                                StudyInstanceUID={this.props.StudyInstanceUID}
                            />:
                            null}



                        {/* {this.props.role.addendun ?
                            <Link style={{ textDecoration: 'none' }} to={{
                                pathname: this.props.addendun, pid: this.props.pid, pname: this.props.pname,
                                study_type: this.props.description?.StudyDescription,
                                study_date: this.props.description?.StudyDate
                            }}  >
                                <button className='dropdown-item ' type='button' hidden={this.props.hiddenDelete}
                                >
                                    Addendum
                                </button>
                            </Link> : null} */}






                    </Dropdown.Menu>
                </Dropdown>
            </Fragment >
        )
    }
}

const mapStateToProps = (state) => ({
    role: state.PadiMedical.roles
})

export default connect(mapStateToProps, null)(ActionBoutonReport);
