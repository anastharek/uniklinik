import axios from 'axios';
import { ca } from 'date-fns/locale';
import React, { Fragment, useEffect, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { toast } from 'react-toastify';
import ConfListTable from './ConfListTable';
import apis from '../../../services/apis';
const AiAutoRouter = () => {
    const [data,setData]=useState({
        modality:'',
        series_description:'',
        link:''

    });
    const [confList, setConfList] = useState([]);
    useEffect(() => {
       fetchConfig();
    },[]);

    const fetchConfig=async()=>{
        try{
            let res=await apis.aiautorouter.get();
            if(res){
                setConfList(res)
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
            let res=await axios.post('/api/ai-autorouter',data)
            if(res.status==200){
                toast.success('Config. saved successfully')
            }
        }catch(e){
            toast.error('Error saving config.')
        }
        finally{
            setData({
                modality:'',
                series_description:'',
                link:''
            });
            fetchConfig();
        }
    }

    const handleDelete=async(id)=>{
      apis.aiautorouter.delete(id)
      .then((res)=>{
            if(res.status==200){
                toast.success('Config. deleted successfully')
            }
        })
        .catch((e)=>{
            toast.error('Error deleting config.')
        })
        .finally(()=>{fetchConfig()})
    }


    return (
        <>
        <Row className="mb-3">
            <Col>
                <h2 className="card-title">AI AutoRouter</h2>
            </Col>
        </Row>
        <ConfListTable confList={confList} onDelete={handleDelete}/>
        <form onSubmit={saveConfig}>      
            <Row className="form-group mt-4 align-items-center">
               <Row className='mb-4'>
                <Col>
                    <label htmlFor="name">Modality</label>
                    <input type='text' value={data.modality} name="modality"  onChange={onChange} className="form-control mt-1"  required/>
                </Col>
                <Col >
                    <label htmlFor="name">Description</label>
                    <input type='text' value={data.series_description} name="series_description"  onChange={onChange} className="form-control mt-1"  required/>
                </Col>
               </Row>
               <Row className='mb-4'>
               <Col>
                    <label htmlFor="url">Url</label>
                    <input type='text' value={data.link} name="link"  onChange={onChange} className="form-control mt-1" required/>
                </Col>
               </Row>
               
                
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

export default AiAutoRouter;