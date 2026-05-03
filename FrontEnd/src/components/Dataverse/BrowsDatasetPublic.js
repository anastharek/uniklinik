import React, { useEffect, useState,useRef } from "react";
import DatasetCard from "../Card/DatasetCard";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Radio,
  TextField,
} from "@material-ui/core";
import Pagination from "@material-ui/lab/Pagination";
import "./BrowsDataset.css";
import axios from "axios";
import ViewDataset from "./ViewDataset";
import { useSelector } from "react-redux";

const BrowseDataset = () => {
  const [page, setPage] = useState(1);
  const [data,setData]=useState({count:0,rows:[],study_field:[]});
  const [loading,setLoaidng]=useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const roles = useSelector((state) => state.PadiMedical.roles);
  const [selectedStudyField, setSelectedStudyField] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState([]);
  const [selectedModality, setSelectedModality] = useState(null);
  const [sampleCount, setSampleCount] = useState(null);
  const [query,setQuery]=useState(null);
  const ref=useRef(null);
  useEffect(() => {
    fetchDataset();
  }, [page,selectedStudyField,selectedFileType,sampleCount,query,selectedModality]);

  const fetchDataset = () => {
    let temp={page};
    if(selectedStudyField){
      temp.study_field=selectedStudyField;
    }
    if(selectedFileType.length>0){
      temp.file_type=selectedFileType;
    }
    if(query){
      temp.query=query;
    }
    if(selectedModality){
      temp.modality=selectedModality;
    }
    if(sampleCount){
      temp.sampleCount=sampleCount;
    }
    let params = new URLSearchParams(temp).toString();
    setLoaidng(true);
    axios.get(`/api/dataverse?${params}`).then((res) => {
      setData(res.data);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setLoaidng(false);
    });
  }

  // Calculate the number of pages
  const pageCount = Math.ceil(data.count / 100);
  // Handle page change
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleView = (id) => {
    setSelectedId(id);
  };
  // if(loading){
  //   return <h3>Loading...</h3>
  // }

  if(selectedId){
    return <ViewDataset id={selectedId} goBack={()=>setSelectedId(null)}/>
  }

  const handleFileTypeChange = (e) => {
    if(e.target.checked){
      setSelectedFileType([...selectedFileType,e.target.value]);
    }else{
      setSelectedFileType(selectedFileType.filter(item=>item!==e.target.value));
    }
  }

  const handleDatasetNumberChange = (number) => {
    if(number==sampleCount){
      setSampleCount(null);
      return;
    }
    setSampleCount(number);
  }

  const handleTextChange = (e) => {
    if(ref.current){
      clearTimeout(ref.current);
    }
    ref.current=setTimeout(()=>{
      setQuery(e.target.value);
    },500);
    
  }

  const handleStudyFieldChange = (value) => {
    console.log(value);
    if(value===selectedStudyField){
      setSelectedStudyField(null);
    }
    else{
      setSelectedStudyField(value);
    }
    setPage(1);
  }
  return (
    <>
      <div
        style={{ maxWidth: 1400, marginInline: "auto" }}
        className="container search-section"
      >
        <div className="row mb-4">
          <div className="col-md-8 mt-2 py-2 offset-md-2">
            <h1 style={{ color: "#1368a5" }} className="h1 text-center">
              Browse Medical Datasets
            </h1>
          </div>
        </div>
        <div className="tags-area-dataverce my-3">
          {data.study_field.map((item, index) => (
            <button key={index} onClick={()=>{handleStudyFieldChange(item)}} style={{textTransform:'capitalize'}} className={`${selectedStudyField===item?"btn-primary":''} btn`}>
              {item}
            </button>
          ))}
        </div>
        <div className="row content-area">
          <div className="col-md-3 filterArea">
            <div className="filter-section px-4 pt-5">
              <TextField size="small" variant="outlined" label="Search" onChange={handleTextChange} fullWidth />
              <p className="h6 mt-4 text-dark">File Type</p>
              <div style={{ marginLeft: 15 }}>
                <FormControlLabel
                  label="DICOM"
                  className="text-dark"
                  value={"DICOM"}
                  onChange={handleFileTypeChange}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
                <FormControlLabel
                  label="JPEG"
                  className="text-dark"
                  value={"JPEG"}
                  onChange={handleFileTypeChange}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
                <FormControlLabel
                  label="PNG"
                  className="text-dark"
                  value={"PNG"}
                  onChange={handleFileTypeChange}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
                <FormControlLabel
                  label="VIDEO"
                  className="text-dark"
                  value={"VIDEO"}
                  onChange={handleFileTypeChange}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
              </div>
              <p className="h6 mt-4 text-dark">Number of Dataset</p>
              <div style={{ marginLeft: 15 }}>
                <FormControlLabel
                  label="0-100"
                  className="text-dark"
                  checked={sampleCount===100}
                  onChange={()=>handleDatasetNumberChange(100)}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
                <FormControlLabel
                  label="101-200"
                  className="text-dark"
                  checked={sampleCount===200}
                  onChange={()=>handleDatasetNumberChange(200)}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
                <FormControlLabel
                  label="201-300"
                  className="text-dark"
                  checked={sampleCount===300}
                  onChange={()=>handleDatasetNumberChange(300)}
                  control={<Checkbox size="small" style={{ color: "#000" }} />}
                />
              </div>
              <p className="h6 mt-4 text-dark">Modalities</p>
             
             <select onChange={(e)=>setSelectedModality(e.target.value)} name="modality" className="form-select">
                <option value="">Select Modality</option>
                {data.modality?.map((item)=>(<option key={item} value={item}>{item}</option>))}
             </select>
              {/* <Button
                size="small"
                variant="contained"
                onClick={fetchDataset}
                style={{ background: "#1368a5", color: "#fff", borderRadius: 10, marginTop: 50 }}
                fullWidth
              >
                Apply filter
              </Button> */}
            </div>
          </div>
          <div className="col-md-9 card-section-dataverse h-100">
            {loading && <CircularProgress size={25} style={{display:'block',marginInline:'auto'}}/>}
            {(data.rows.length===0 && !loading) && <h3 className="mt-2 text-center">No data found</h3>}
            <div className="row">
              {data.rows.map((item, index) => (
                <DatasetCard key={index}  openLink={item.id} onViewClick={handleView} data={item} 
                />
              ))}
            </div>
          </div>
        </div>
        <div className="pagination-container">
              <Pagination
                count={pageCount}
                page={page}
                onChange={handleChangePage}
                color="primary"
                style={{ marginTop: "20px", justifyContent: "center", display: "flex" }}
              />
            </div>
      </div>
    </>
  );
};

export default BrowseDataset;
