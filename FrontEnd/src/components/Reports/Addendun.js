import React, { useEffect, useState } from 'react';
import Logo from '../../assets/images/Padimedical.png';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';


const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return dd + '/' + mm + '/' + yyyy;
}


const Addendun = () => {
    const [editing, setEditing] = useState(false)
    const { pid, pname, study_type, study_date } = useLocation();
    const [data, setData] = useState({
        patient_name: pname,
        tag: '',
        study_type: study_type,
        text: null,
        study_date: study_date,
        patient_id: null,
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
        fetch("/api/patient-report", {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: JSON.stringify({
                studyid: id,
            })
        })
            .then(res => {
                if (res.status == 200)
                    return res.json()
                else
                    throw "Bad req"
            })
            .then(res => {
                setData({
                    patient_name: res?.patient_name || '',
                    tag: res?.tag || '',
                    study_type: res?.study_type || '',
                    study_type: res?.study_type || '',
                    study_date: res?.study_date || study_date,
                    patient_id: res?.patient_id || pid,
                    text: res?.text
                });
                setEditing(true);
            }).catch()
    }

    const validate = () => {
        let data1 = [data.patient_name, data.study_type,]
        let key = ['patient name', 'study type',]
        let error = false;
        data1.map((element, index) => {
            if (element == '' || element == null) {
                error = true;
                toast.error(`${key[index]} field is required`);
            }
        })



        return error
    }

    const handleChange = (e) => {
        setData(prev => { return { ...prev, [e.target.name]: e.target.value } })
    }



    const Addendum = (e) => {
        e.preventDefault()
        if (!validate()) {
            fetch("/api/create-report-final", {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                },
                method: "POST",
                body: JSON.stringify({
                    patient_name: data.patient_name,
                    studyid: id,
                    text: data?.text || '',
                    tag: '',
                    addendumby: roles?.firstname || roles.username,
                    addendum_at: getTodayDate(),
                    ...data,
                    patient_id: data.patient_id || pid,
                })
            }).then((res) => {
                if (res.status == 201) {
                    fetchReport();
                    toast.success('report saved !!');
                } else {
                    toast.error('something went wrong !!');
                }
            })
        }

    }

    return (<>
        <div className="mb-5">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img height={50} src={Logo} />
            </div>
            <form style={{ maxWidth: 800, marginTop: 50 }} className='container'>
                <div className='row d-flex'>
                    <div className='col-6'>
                        <label for="pname" class="form-label">Patient's Name</label>
                        <input required value={data.patient_name} name='patient_name' onChange={handleChange} id='pname' className='form-control' />
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
                        <input id='stype' name='study_type' value={data.study_type} onChange={handleChange} className='form-control' required />
                    </div>

                    <div className='col-6'>
                        <label for="sdata" class="form-label">Study Date</label>
                        <input id='sdata' name='study_date' value={study_date} className='form-control' readOnly />
                    </div>
                </div>
                <br />
                <br />
                <div className='row d-flex'>
                    <div className='col-12'>
                        <textarea
                            className='form-control'
                            cols='12'
                            rows='10'
                            name='text'
                            value={data?.text}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <br />
                <div className='d-flex'>
                    <Button disabled={!roles.edit_patient_report} onClick={Addendum} className='btn m-1'>Finalize</Button>
                </div>
            </form>
        </div>
    </>)
}

export default Addendun;