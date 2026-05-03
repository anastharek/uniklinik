import { useEffect, useRef, useState } from "react";
import InventoryTable from "./InventoryTable";
import ExportExcelInventory from "./DownloadExcel";
import QRCode from "../../QRCode";
import ScanPopup from "../../ScanPopup";
import { toast } from "react-toastify";
import { Modal,Row,Col} from "react-bootstrap";

const InventoryOverview = () => {
  const [data,setData]=useState([]);
  const [qr,setQr]=useState(null)
  const [scannig,setScanning]=useState(false);
  const [searchData,setSearchData]=useState({})
  const [otherData,setOtherData]=useState({});
  const [deleteId,setDeletedId]=useState(null);
  const [usedProduct,setUsedProduct]=useState(null);
  

  useEffect(()=>{
    fetchReletedData();
    fetchData();
  },[])

  const fetchReletedData=()=>{
    fetch('/api/inventory/related-data')
    .then(res=>res.json())
    .then(res=>{
      setOtherData(res.data)
    })
  }
 
  const fetchData=()=>{
    fetch('/api/inventory/items')
    .then(res=>res.json())
    .then(res=>{
      setData(res.data)
    })
  }
 

  const search=(e)=>{
    e?.preventDefault()
    let temp={};
    Object.keys(searchData).map(key=>{
      if(searchData[key]!==''){
        temp[key]=searchData[key];
      }
    })
    const queryString = new URLSearchParams(temp).toString();
    fetch('/api/inventory/items?'+queryString)
    .then(res=>res.json())
    .then(res=>{
      setData(res.data)
    })
  }

  const handleSearchDataChange=(e)=>{
    setSearchData(prev=>({...prev,[e.target.name]:e.target.value}))
  }


  const Scan=()=>{
    setScanning(true);
  }

  const scanResult=(id)=>{
    const queryString = new URLSearchParams({stock_id:id}).toString();
    fetch('/api/inventory/items?'+queryString)
    .then(res=>res.json())
    .then(res=>{
      setData(res.data)
     // setUsedProduct(res.data[0])
      setScanning(false)
    })
    
  }
  
  const saveModal=(id)=>{
    let index=data.findIndex(obj=>obj.id==id)
    fetch('/api/inventory/item',{
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      method:'put',
      body:JSON.stringify(data[index])
    })
    .then(res=>res.json())
    .then(res=>{
      toast.success('updated succesfully !')
      fetchData();
    })
    .catch(err=>{
      toast.error('something went wrong !')
    })
  }

  const changeHandler=(initialValue,value, row, column)=>{
    let temp=[...data]
    temp.find(obj => obj.id === row.id)[column] = value;
    setData(data)   
  }

  const deleteRecord = () => {
    fetch(`/api/inventory/item/${deleteId.id}`,{method:'delete'})
    .then((res)=>{
     fetchData();
     if(res.status==201){
       toast.success('inventory deleted sucessfully !')
     }
     setDeletedId(null)
   })
  }

  const handleClear=(e)=>{
    e.preventDefault();
    setSearchData({})
  }

  const useItems=()=>{
    fetch('/api/inventory/use-inventory-item',{
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      method:'post',
      body:JSON.stringify({id:usedProduct.id})
    })
    .then(res=>res.json())
    .then(res=>{
      if(res=='qty is already 0.'){
        return toast.error('')
      }
      fetchReletedData();
      fetchData();
      toast.success('added to used item !')
    })
    .catch(err=>{
      toast.error('something went wrong !')
    })

    setUsedProduct(null);
  }
  return (
    <>
   {qr && <QRCode value={qr} onClose={()=>setQr(null)}/>}
   {scannig && <ScanPopup setScanning={setScanning} scanResult={scanResult}
   fps={10}
   qrbox={250}
   disableFlip={false}
   qrCodeSuccessCallback={scanResult}
   />}
    <form onSubmit={search} class="">
      <h4 class="text-center">InventoryOverview</h4>
      <br />
      <br />
      <div>
        <section className="row">
          <div className="col-lg-3 col-md-6 col-12">
            <label className="form-label">
              Item Code
            </label>
            <input
              type="text"
              name="item_code"
              className="form-control"
              value={searchData.item_code||''}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
              Item Name
            </label>
            <input
              type="text"
              name="item_name"
              className="form-control"
              value={searchData.item_name||''}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Type
            </label>
            <input
              type="text"
              name="type"
              className="form-control"
              value={searchData.type||''}
              onChange={handleSearchDataChange}
              
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Store Location
            </label>
            <select name="store_location" onChange={handleSearchDataChange} value={searchData.store_location||''} className="form-select" >
              <option value='' hidden>select store location</option>
             {otherData?.location?.map(({id,location})=><option value={id}>{location}</option>)}
            </select>
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             From Expiry Date
            </label>
            <input
              type="date"
              className="form-control"
              name="expiry_from"
              value={searchData.expiry_from||''}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             To Expiry Date
            </label>
            <input
              type="date"
              name="expiry_to"
              className="form-control"
              value={searchData.expiry_to||''}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Manufactur Name
            </label>
            <select name="manufacture" value={searchData.manufacture||''} onChange={handleSearchDataChange} className="form-select" >
            <option value='' >select manufacture</option>
              {otherData?.manufacture?.map(({id,name})=><option  value={id}>{name}</option>)}
            </select>
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Vendor Name
            </label>
            <select name="vendor" value={searchData.vendor||''} onChange={handleSearchDataChange} className="form-select" >
            <option value=''>select vendor</option>
            {otherData?.vendor?.map(({id,name})=><option  value={id}>{name}</option>)}
            </select>
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Category
            </label>
            <select name="category" value={searchData.category||''} onChange={handleSearchDataChange} className="form-select" >
             <option value='' >select category</option>
             {otherData?.category?.map(({id,name})=><option  value={id}>{name}</option>)}
            </select>
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
             Stock ID
            </label>
            <input
              type="text"
              name="stock_id"
              className="form-control"
              value={searchData.stock_id||''}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <br/>
            <button onClick={Scan} className=" btn otjs-button otjs-button-blue" >
            <i class="fas fa-qrcode"></i> Scan QR
            </button>
          </div>
          <div className="col-12 mt-5 text-center">
          <button className=" btn otjs-button otjs-button-blue" >Search</button>
          <button type="button" onClick={handleClear} className="btn otjs-button otjs-button-orange p-2 ms-4" >Clear</button>
          </div>
        </section> 
      </div>
      </form>

      <section className="mt-5">
        <div className="ms-auto text-end d-block mb-4">
        <ExportExcelInventory data={data}/>
        </div>
        
        <InventoryTable 
        inventory={data} 
        changeHandler={changeHandler} 
        saveModal={saveModal} setQr={setQr}
        setDeletedId={setDeletedId}
        setUsedProduct={setUsedProduct}
        refresh={fetchData}
        />
      </section>
    

    <Modal id='delete' show={deleteId?.id} onHide={()=>setDeletedId(null)} size='sm'>
          <Modal.Header closeButton>
              <h2 className='card-title'>Delete Inventory</h2>
          </Modal.Header>
          <Modal.Body className="text-center">
              Are You sure to delete {deleteId?.item_name} ?
          </Modal.Body>
          <Modal.Footer>
              <Row className="text-center mt-2">
                  <Col>
                      <button type='button' className='otjs-button otjs-button-blue'
                          onClick={() => setDeletedId(null)}>Close
                      </button>
                  </Col>
                  <Col>
                      <button type='button' className='otjs-button otjs-button-red' onClick={deleteRecord}>Delete</button>
                  </Col>
              </Row>
          </Modal.Footer>
      </Modal>


    <Modal id='delete' show={usedProduct?.id} onHide={()=>setUsedProduct(null)} size='sm'>
          <Modal.Header closeButton>
              <h4 className='card-title'>Add used product</h4>
          </Modal.Header>
          <Modal.Body className="text-left">
             Did you used this product  ??
             <br/>
             <br/>
             Item Name : {usedProduct?.item_name} <br/><br/>
             Item Code : {usedProduct?.item_code} <br/><br/>
             Stock Id : {usedProduct?.stock_id} <br/><br/>
          </Modal.Body>
          <Modal.Footer>
              <Row className="text-center mt-2">
                  <Col>
                      <button type='button' className='otjs-button otjs-button-blue'
                          onClick={() => setUsedProduct(null)}>No
                      </button>
                  </Col>
                  <Col>
                      <button type='button' className='otjs-button otjs-button-red' onClick={useItems}>Yes</button>
                  </Col>
              </Row>
          </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryOverview;
