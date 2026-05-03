import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DisableDevtool from 'disable-devtool';
const ExternalLink=()=>{
    const {state}=useLocation();
    const [data,setData]=useState(state)

    
    useEffect(()=>{
        let link=state?.link||localStorage.getItem('temp-link');
        if(!state?.link && !link){
          return window.location.href='/login'
        }
        setData({link})
        localStorage.removeItem('temp-link');
        let body=document.body;
        body.style.background='none';
        body.style.margin='0px'
        body.style.padding='0px'
        //DisableDevtool()
        return ()=>{
            body.style={}
        }
    },[])   

    return(
        <>
        <iframe src={data?.link} contentEditable='false' allowFullScreen='true'  aria-hidden='true' style={{width:'100vw',height:'100vh'}}/>
        </>
    )
}
export default ExternalLink;