import React, { useEffect, useState } from 'react';
import Logo from '../../assets/images/Padimedical.png'; //tukar report template - logo

import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
const RequestReport = () => {
    const { pid, pname, study_type, study_date, accessor, StudyInstanceUID } = useLocation();
    const [data, setData] = useState({
        patient_name: pname,
        patient_id: pid,
        study_type: study_type || '',
        request_type: 'normal',
        text: '',
        radiologist_email: null,
    });
    const { id } = useParams();
    const roles = useSelector(state => state.PadiMedical.roles)

    useEffect(() => {
        window.scrollTo(0, 0)
        document.querySelector('#main').style.width = 'max-content';
        fetchReport();
        return () => {
            document.querySelector('#main').style.width = 'none';
        }
    }, [])


    const fetchReport = () => {
        fetch('/api/request-report/' + id)
            .then(res => {
                if (res.status == 200)
                    return res.json()
                else
                    throw "not found"
            })
            .then(res => setData({
                patient_name: res.patient_name,
                patient_id: res.patient_id,
                study_type: res.study_type,
                request_type: res.request_type,
                text: res.text,
                radiologist_email: res.radiologist_email
            }))
            .catch(err => console.log(err))
    }
    const handleChange = (e) => {
        if (e.target.name == 'request_type') {
            return setData(prev => { return { ...prev, [e.target.name]: e.target.id } })
        }
        setData(prev => { return { ...prev, [e.target.name]: e.target.value } })
    }

    const handleSubmit = (e) => {
        fetch('/api/request-report', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: 'post',
            body: JSON.stringify({
                ...data, studyid: id, study_date, accessor, StudyInstanceUID, req_by: roles.firstname, department: roles.department,
                practicing_no: roles.practicing_no, study_type:data.study_type ||" ",
            })
        })
            .then(() => toast.success('request submited !!'))
    }
    return (<>
        <div className="mb-5"> {/*tukar report template - change logo size*/}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <img height={120} src={Logo} />
            </div>
            <form style={{ maxWidth: 800, marginTop: 10 }} className='container'>
                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="pname" class="form-label">Patient's Name</label>
                        <input required readOnly value={data.patient_name} name='patient_name' onChange={handleChange} id='pname' className='form-control' />
                    </div>
                    <div className='col-6'>
                        <label for="pid" class="form-label">Patient's ID</label>
                        <input required defaultValue={pid} readOnly id='pid' className='form-control' />
                    </div>
                </div>
                <br />
                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="stype" class="form-label">Study Type</label>
                        <input id='stype' name='study_type' readOnly value={study_type} onChange={handleChange} className='form-control' required />
                    </div>

                    <div className='col-6'>
                        <label for="sdate" class="form-label">Study Date</label>
                        <input id='sdate' name='sdate' readOnly value={study_date} onChange={handleChange} className='form-control' required />
                    </div>
                </div>
                <br />
                {roles.can_add_radiologist_email ?
                    <div className='row d-flex'>
                        <div className='col-6'>
                            <label for="radiologist-email" class="form-label">Radiologist Email</label>
                            <input type='email' id='radiologist-email' name='radiologist_email' value={data.radiologist_email} onChange={handleChange} className='form-control' required />
                        </div>
                    </div> : null}

                <br />
                <br />
                <div className='row d-flex'>
                    <div className='col-12'>
                        <textarea name='text' value={data.text} onChange={handleChange} className='col-12 form-control' style={{ border: '1px solid #ced4da', borderRadius: 5, padding: 5 }} rows={10} placeholder='Indication'>
                        </textarea>
                    </div>
                </div>
                <br />
                <div className='row d-flex'>
                    <div className='col-3'>
                        <label className='form-label'><b>Request Type</b></label>
                    </div>

                    <div className='col-6'>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" id='urgent' onChange={() => { }} onClick={handleChange} name="request_type" checked={data.request_type == 'urgent'} />
                            <label class="form-check-label" for="urgent">
                                urgent
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" id='normal' onChange={() => { }} onClick={handleChange} name="request_type" checked={data.request_type == 'normal'} />
                            <label class="form-check-label" for="normal">
                                normal
                            </label>
                        </div>
                    </div>
                </div>
                <br />
                <br />
                <div onClick={handleSubmit} className='d-flex'>
                    <Button className='btn m-1'>Request</Button>
                </div>
            </form>
        </div>
    </>)
}

export default RequestReport;
