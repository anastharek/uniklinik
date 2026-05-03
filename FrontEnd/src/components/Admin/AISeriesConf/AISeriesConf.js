import axios from 'axios';
import { ca } from 'date-fns/locale';
import React, { Fragment, useEffect, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { toast } from 'react-toastify';
import ConfListTable from './ConfListTable';
import apis from '../../../services/apis';
const AISeriesConf = () => {
    const [data,setData]=useState({ name: '', url: '' });
    const [confList, setConfList] = useState([]);
    useEffect(() => {
       fetchConfig();
    },[]);

    const fetchConfig=async()=>{
        try{
            let res=await apis.aiConf.get();
            if(res.data){
                setConfList(res.data)
            }
        }catch(e){
            console.log(e)
        }
    }
    const onChange=(e)=>{
        setData({...data,[e.target.name]:e.target.value});
    }
    const saveConfig=async(e)=>{
        try{
            e.preventDefault();
            let res=await axios.post('/api/ai-series-conf',data)
            if(res.status==200){
                toast.success('Config. saved successfully')
            }
        }catch(e){
            toast.error('Error saving config.')
        }
        finally{
            setData({name:'',url:''});
            fetchConfig();
        }
    }

    const handleDelete=async(id)=>{
       await apis.aiConf.delete(id)
       toast.success('Config. deleted successfully')
       fetchConfig();
    }


    return (
        <>
        <ConfListTable confList={confList} onDelete={handleDelete}/>
        <form onSubmit={saveConfig}>
            <Row className="mt-3">
                <Col>
                    <h2 className="card-title">AI Series Conf.</h2>
                </Col>
            </Row>
            <Row className="form-group mt-4 align-items-center">
                <Col sm={2}>
                    <label htmlFor="name">Name : </label>
                </Col>
                <Col sm={4}>
                    <input type='text' value={data.name} name="name"  onChange={onChange} className="form-control"  required/>
                </Col>
                <Col sm={1}>
                    <label htmlFor="url">Url : </label>
                </Col>
                <Col sm={5}>
                    <input type='text' value={data.url} name="url"  onChange={onChange} className="form-control" required/>
                </Col>
                
            </Row>
            <Row className="mt-4 align-items-center text-center">
                <Col>
                    <input type='submit' className='otjs-button otjs-button-blue' value='Save' />
                </Col>
            </Row>
        </form>
        </>
    )
}

export default AISeriesConf;