import React, { useEffect, useState ,useMemo} from 'react';
import { ArrowBack } from '@material-ui/icons';
// import { DataGrid } from '@material-ui/data-grid';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import getColumsByData from '../../utils/getDataColumnByTable';
import { useSelector } from 'react-redux';
import RequestFormPopupDataset from './MyDataset/RequestFormPopupDataset';
import { toast } from 'react-toastify';
import { useParams,useHistory } from 'react-router-dom';
import SweetAlert from 'react-bootstrap-sweetalert';
import moment from 'moment';
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ExportExcel = ({data, column_sequence =[]}) => {
    let keys=column_sequence.length? column_sequence : Object.keys(data[0]);
    return (
        <ExcelFile element={<button style={{ width: 'max-content' }} className='otjs-button otjs-button-green'>Export/Download</button>}>
            <ExcelSheet data={data} name="Employees">
                {keys.map((key,index)=>{
                    return <ExcelColumn key={index} label={key} value={key} />
                })}
            </ExcelSheet>
        </ExcelFile>
    )
}

export default function ViewDataset({goBack,id,disablePurchase}) {
  const [data,setData]=useState({});
  const {dataset_id}=useParams()
  const roles = useSelector((state) => state?.PadiMedical?.roles);
  const history=useHistory();
  const [needRegister,setNeedRegister]=useState(false);
  useEffect(()=>{
    let url=dataset_id?`/api/dataverse-public/${dataset_id}`:`/api/dataverse/${id}`;
    axios.get(url)
    .then((res)=>{
      setData(res.data);
    })
    .catch((err)=>{
      console.log(err);
    })
  },[id]);
  
  const {rows,columns}=useMemo(()=>{
    let rows=[];
    let columns=[];
    let mainData=data.all_data||data.preview_data;
    if(mainData && mainData.length>0){
      columns=getColumsByData(mainData,data.column_sequence);
      rows=mainData.map((row,index)=>{
        return {...row,id:index}
      });
    }
    return {rows,columns};
  },[data]);

  const getFreeDataset=()=>{
    if(!roles.username){
     return setNeedRegister(true);
    }
    axios.post(`/api/dataverse/subscribe`,{dataset_id:id})
    .then(()=>{
      toast.success("Dataset Subscribed Successfully");
    })
    .catch((err)=>{
      if(err?.response?.data?.message){
        toast.error(err.response.data.message);
      }
    });
  }

  if(!data.id){
    return <div>Loading...</div>
  }
  return (
    <>
    {
      needRegister &&
      <SweetAlert
      warning
      showCancel
      confirmBtnText="Yes, countinue !"
      confirmBtnBsStyle="info"
      title="You need to register to get this dataset"
      onConfirm={()=>{
        history.push("/register");
      }}
      onCancel={() => {
        setNeedRegister(false);
      }}
      focusCancelBtn
    ></SweetAlert>
    }
    <div style={{background:"#fff",padding:30,maxWidth:'1000px',width:"98%",marginInline:'auto', marginTop:40,borderRadius:10}}>
      <button
        style={{
          background: "none",
          border: "none",
          fontSize: "18px",
          // display:dataset_id?"none":"block",
        }}
        onClick={()=>{
          if(dataset_id){
            history.push(`/dataverse`);
          }else{
            if(goBack){
              goBack();
            }
          }
       }}
      >
        <ArrowBack /> Go back
      </button>
      <h4 className="text-center my-4">{data.name}</h4>
      <p style={{whiteSpace:'pre-wrap',textAlign:'justify'}} className="lh-base">{data.detail}</p>
      <div style={{rowGap:20}} className="row my-4">
        <div className="col-4 col-sm-3">No. of samples: {data.sample_count}</div>
        <div className="col-4 col-sm-3">File Type : {data.type}</div>
        <div className="col-4 col-sm-3">Study Field : {data.study_field}</div>
        <div className="col-4 col-sm-3">Modality : {data.modality}</div>
        <div className="col-4 col-sm-3">
          Price : {data.pricing_type == "paid" ? data.price_range : "Free"}
        </div>
        {data['User.firstname']!==null &&<div className="col-4 col-sm-3">Owner : {data['User.firstname']} {data['User.lastname']}</div>}
        <div className='col-4 col-sm-3'>
         Uploaded At : {moment.utc(data.createdAt).utcOffset(8).format("DD/MM/YYYY")}
        </div>
      </div>
      <div className='my-3' style={{display:'flex',justifyContent:'space-between'}}>
      <p className="mt-4 mb-2">
        <b>{data.all_data?"All":"Preview"} Data</b>
      </p>
      {(data?.all_data?.length>0 && roles.download_dataset_excel ) && <ExportExcel key={Math.random()} column_sequence={data.column_sequence} data={rows} />}
      </div>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        rowHeight={35}
        headerHeight={45}
      />
      {!disablePurchase?
      data?.all_data ? null : data.pricing_type == "paid" ? (
        <RequestFormPopupDataset setNeedRegister={setNeedRegister} id={data.id} />
      ) : (
        <button
          onClick={getFreeDataset}
          className="btn otjs-button-blue text-light mt-4 mx-auto"
        >
          Get Full Dataset For Free
        </button>
      ):null}
    </div>
    </>
  );
}
