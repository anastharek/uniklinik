import React, { useState,useEffect, useCallback } from 'react';
import { Col,Row,Modal} from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import AddItemTableExcel from './AddItemTableExcel';
import { toast } from 'react-toastify';
import QRCode from '../../QRCode';
import moment from 'moment';




const AddItemExcel = () => {
  const [inProgress, setProgress] = useState(true);
  const [data,setData]=useState([]);
  const [otherData,setOtherData]=useState({});
  const [qr,setQr]=useState(null)
  const [deleteId,setDeletedId]=useState(null);


  const formateData=useCallback(()=>{
    let location={}
    let vendor={}
    let category={}
    let manufacture={}
    let error=false
    otherData.location.map(obj=>location[obj.location]=obj.id);
    otherData.vendor.map(obj=>vendor[obj.name]=obj.id);
    otherData.category.map(obj=>category[obj.name]=obj.id);
    otherData.manufacture.map(obj=>manufacture[obj.name]=obj.id);

    let formated=data.map(obj=>{
      if(!manufacture[obj['Manufacture Name']]){
        toast.error(`${obj['Manufacture Name']} not valid manufacture`)
        error=true;
      }
      if(!vendor[obj['Vendor Name']]){
        toast.error(`${ obj['Vendor Name']} not valid vendor`)
        error=true;
      }
      if(!category[obj['Category']]){
        toast.error(`${obj['Category']} not valid category`)
        error=true;
      }
      if(!location[obj['Store']]){
        toast.error(`${obj['Store']} not valid location`)
        error=true;
      }
      if(!moment(obj['Expiry Date'], 'DD/MM/YYYY').isValid()){
        toast.error(`${obj['Expiry Date']} not valid date`)
        error=true;
      }
      return {
        item_code:obj['Item Code'],
        item_name:obj['Item Name'],
        item_description:obj['Description'],
        category:  category[obj['Category']],
        type:obj['Type'],
        store_location:  location[obj['Store']],
        unit_quantity:obj['QTY'],
        expiry_date:moment(obj['Expiry Date'], 'DD/MM/YYYY').format('YYYY-MM-DD'),
        cost_per_unit:obj['Cost Per Unit'],
        total_cost:obj['Total Cost'],
        manufacture:  manufacture[obj['Manufacture Name']],
        vendor:       vendor[obj['Vendor Name']],
        min_qty:obj['Min Remaning Qty']==''?0:parseFloat(obj['Min Remaning Qty']),
      }
    })
    return {formated,error};
  },[otherData,data])

  function ExcelDateToJSDate(date) {
    return new Date(Math.round((date - 25569)*86400*1000));
  }
  const handleDrop = (files) => {
    setProgress(true)
    const file = files[0];
    // if (file) {
    //   const reader = new FileReader();
    //   reader.onload = (event) => {
    //     const workbook = XLSX.read(event.target.result, { type: 'binary' });
    //     const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    //     const worksheet = workbook.Sheets[sheetName];
    //     const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    //     const header = parsedData[0]; // Assuming the first row contains headers
    //     const rows = parsedData.slice(1); // Remaining rows are data

    //     const jsonData = rows.map((row) => {
    //       const rowData = {};
    //       row.forEach((value, index) => {
    //         if(header[index]=='Expiry Date' && typeof value=='number'){
    //             rowData[header[index]] = moment(ExcelDateToJSDate(value)).format('DD/MM/YYYY');
    //         }else{
    //           rowData[header[index]] = value;
    //         }
            
    //       });
    //       return rowData;
    //     });
    //     console.log(jsonData);
    //     setData(jsonData);
    //     setProgress(false);
    //   };
    //   reader.readAsBinaryString(file);
    // }  
  }
  
  useEffect(()=>{
    fetchData();
  },[])

  const fetchData=()=>{
    fetch('/api/inventory/related-data')
    .then(res=>res.json())
    .then(res=>{
      setOtherData(res.data)
    })
  }
 
  const handleSave=(e)=>{
    e.preventDefault();
    let {formated,error}=formateData(data)
    if(error) return;
    fetch('/api/inventory/create-item-bulk',{
      method:'post',
      body:JSON.stringify({all_data:formated}),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
    .then((res)=>{
      if(res.status==200){
        toast.success('items uploaded successfully !')
      }else{
        toast.error('something went wrong')
      }
     
    })
    .catch(()=>{
      toast.error('something went wrong')
    })
  }

  const changeHandler=(initialValue,value, row, column)=>{
    let temp=[...data]
    temp.find(obj => obj.id === row.id)[column] = value;
    setData(data)   
  }

  const deleteRecord=()=>{
    let temp=[...data];
    temp.splice(deleteId,1)
    setData(temp)
    setDeletedId(null);
  }

  return (
    <>
    {qr && <QRCode value={qr} onClose={()=>setQr(null)}/>}
    <Row className="mt-5">
      <Col className='col-12'>
        <Dropzone onDrop={handleDrop}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div
                className={inProgress ? "dropzone dz-parsing" : "dropzone"}
                {...getRootProps()}
              >
                <div
                  className="responsive"
                  style={{
                    width: "114px",
                    position: "relative",
                    left: "41%",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "31%",
                      left: "76%",
                      width: 130,
                    }}
                  ></div>
                </div>
                <input
                  {...getInputProps()}
                  accept=".xlsx" 
                />
                <p>
                  {inProgress
                    ? "Uploading"
                    : "Drag & Drop Excel files here"}
                </p>
              </div>
            </section>
          )}
        </Dropzone>
      </Col>
      <Col className='col-12'> 
       <AddItemTableExcel setQr={setQr} setDeletedId={setDeletedId} changeHandler={changeHandler} inventory={data}/>
      </Col>
      <Col className='col-12'>
        <button onClick={handleSave} className='btn  otjs-button otjs-button-blue'>save</button>
      </Col>
    </Row>
    <Modal id='delete' show={deleteId!=null} onHide={()=>setDeletedId(null)} size='sm'>
          <Modal.Header closeButton>
              <h2 className='card-title'>Delete Inventory</h2>
          </Modal.Header>
          <Modal.Body className="text-center">
              Are You sure to delete ?
          </Modal.Body>
          <Modal.Footer>
              <Row className="text-center mt-2">
                  <Col>
                      <button type='button' className='otjs-button otjs-button-blue'
                          >Close
                      </button>
                  </Col>
                  <Col>
                      <button type='button' className='otjs-button otjs-button-red' onClick={deleteRecord}>Delete</button>
                  </Col>
              </Row>
          </Modal.Footer>
    </Modal>
    </>
  );
};

export default AddItemExcel;
