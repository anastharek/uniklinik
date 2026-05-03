import React, { useEffect, useState } from 'react';
import Logo from '../../assets/images/Padimedical.png';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';


const RequestAdvanceImagin = () => {
    const { pid, pname, study_type } = useLocation();
    const { id } = useParams();
    const [data, setData] = useState({
        patient_name: pname,
        patient_id: pid,
        study_type: study_type,
        study_id: id,
        text: '  ',
        hospital_email: null,
        patient_email: null,
        patient_phone: '',
        request_date: new Date().toLocaleDateString(),
    });
    const roles = useSelector(state => state.PadiMedical.roles)

    useEffect(() => {
        window.scrollTo(0, 0)
        document.querySelector('#main').style.width = 'max-content';
        fetchReport();
        return () => {
            document.querySelector('#main').style.width = 'none';
        }
    }, [])

    const isConsern = (e) => {
        setData({ ...data, is_consern: e.target.checked })
    }

    const fetchReport = () => {
        fetch('/api/request-imagin/' + id)
            .then(res => {
                if (res.status == 200)
                    return res.json()
                else
                    throw "error"
            })
            .then(res => setData({
                patient_name: res.patient_name,
                patient_id: res.patient_id,
                study_type: res.study_type,
                study_id: res.study_id,
                text: res.text,
                hospital_email: res.hospital_email,
                patient_email: res.patient_email,
                request_date: res.request_date,
                patient_phone: res.patient_phone,
                is_consern: res.is_consern || false,
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
        e.preventDefault();
        fetch('/api/request-imagin/', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: 'POST',
            body: JSON.stringify({ ...data, requested_by: roles.firstname })
        })
            .then(() => toast.success('request submited !!'))
    }
    return (<>
    {/* tukar report - logo size */}
        <div className="mb-5"> 
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img height={120} src={Logo} />
            </div>
            <form onSubmit={handleSubmit} style={{ maxWidth: 800, marginTop: 10 }} className='container'>
                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="hospital" class="form-label">Hospital</label>
                        <select required onChange={handleChange} name='hospital_email' className='form-control'>
                            <option hidden value="">Select Hospital Email</option>
                            <option hidden selected={data.patient_email ? true : false} value={data.hospital_email}>{data.hospital_email}</option>
                            <option value='anastharek@padimedical.com'>Radiology Department</option>  {/* tukar link - email radiology hospital - optional */}
                        </select>
                    </div>
                </div>

                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="patient_id" class="form-label">Patient's ID</label>
                        <input required id='patient_id' name='patient_id' value={data.patient_id} onChange={handleChange} className='form-control' />
                    </div>

                    <div className='col-6'>
                        <label for="patient_name" class="form-label">Patient's Name</label>
                        <input required id='patient_name' value={data.patient_name} onChange={handleChange} name='patient_name' className='form-control' />
                    </div>
                </div>

                <div className='row d-flex'>

                    <div className='col-6'>
                        <label for="patient_email" class="form-label">Patient's Email</label>
                        <input type='email' required id='patient_email' value={data.patient_email} name='patient_email' onChange={handleChange} className='form-control' />
                    </div>

                    <div className='col-6'>
                        <label for="patient_phone" class="form-label">Patient's Phone</label>
                        <input type='tel' required id='patient_phone' value={data.patient_phone} name='patient_phone' onChange={handleChange} className='form-control' />
                    </div>

                </div>


                <br />
                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="stype" class="form-label">Study Type</label>
                        <input id='stype' name='study_type' defaultValue={study_type} onChange={handleChange} className='form-control' required />
                    </div>

                    <div className='col-6'>
                        <label class="form-label">Request Date</label>
                        <input defaultValue={data.request_date} name='request_date' onChange={handleChange} className='form-control' required />
                    </div>
                </div>
                <br />
                <br />
                <div className='row d-flex'>
                    <div className='col-12'>
                        <textarea name='text' defaultValue={data.text} onChange={handleChange} className='col-12 form-control' style={{ border: '1px solid #ced4da', borderRadius: 5, padding: 5 }} rows={10} placeholder='Write Other Indication'>
                        </textarea>
                    </div>
                </div>
                <br />
                <div className='row d-flex'>
                    <div class="form-check">
                        <input id='isconsern' class="form-check-input" defaultChecked={data.is_consern} onClick={isConsern} type="checkbox" />
                        <label class="form-check-label" >
                            Patient is consented for upload study images into clinic PAC's system.
                        </label>
                    </div>
                </div>
                <br />
                <br />
                <div className='d-flex'>
                    <Button type='submit' className='btn m-1'>Request</Button>
                </div>
            </form>
        </div>
    </>)
}

export default RequestAdvanceImagin;
