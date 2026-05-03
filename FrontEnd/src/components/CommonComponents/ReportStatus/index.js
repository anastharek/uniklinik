import { useEffect, useState } from "react";

const ReportStatus = ({ status }) => {


  const getStatus=()=>{
    if(status=='Finalize'){
        return <p  style={{color:'green',width:100,textAlign:'center',fontWeight:'bold',textShadow:"1px 1px 1px #eeeeee"}}>Finalize</p>
    }
    if(status=='Draft'){
        return <p style={{color:'#F1A630',width:100,textAlign:'center',fontWeight:'bold',textShadow:"1px 1px 1px #eeeeee"}}>Draft</p>
    }
    return <p style={{color:'#000',width:100,textAlign:'center'}}>Pending</p>
  }
  return (
        <>{getStatus()}</>
  );
};
export default ReportStatus;
