import { useEffect, useRef, useState } from "react";
import { Modal,Row,Col} from "react-bootstrap";
import AddLocationModal from "./AddLocationModal";
import LocationTable from "./LocationTable";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const Location = () => {
  const [showModal,setShowModal]=useState(false);
  const [data,setData]=useState([]);
  const [searchData,setSearchData]=useState({})
  const [deleteId,setDeletedId]=useState(null);
  const roles = useSelector((state) => state.PadiMedical.roles);

  const toogleModal=()=>{
    setShowModal(prev=>!prev);
  }

  useEffect(()=>{
    fetchData();
  },[])

  const fetchData=()=>{
    fetch('/api/inventory/locations')
    .then(res=>res.json())
    .then(res=>{
      setData(res.data)
    })
  }

  const search=(e)=>{
    e.preventDefault()
    const queryString = new URLSearchParams(searchData).toString();
    fetch('/api/inventory/locations?'+queryString)
    .then(res=>res.json())
    .then(res=>{
      setData(res.data)
    })
  }

  const handleSearchDataChange=(e)=>{
    setSearchData(prev=>({...prev,[e.target.name]:e.target.value}))
  }
  const saveModal=(id)=>{
    let index=data.findIndex(obj=>obj.id==id)
    fetch('/api/inventory/location',{
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
    fetch(`/api/inventory/location/${deleteId.id}`,{method:'delete'})
    .then((res)=>{
     fetchData();
     if(res.status==201){
       toast.success('vendor deleted sucessfully !')
     }
     setDeletedId(null)
   })
}

  return (
    <div class="container ">
      <h4 class="text-center">Location</h4>
      {showModal && <AddLocationModal fetchData={fetchData} setShowModal={setShowModal}/>}
      <br />
      <br />
      <div>
        <section className="row">
          <div className="col-lg-3 col-md-6 col-12">
            <label className="form-label">
              Location
            </label>
            <input
              type="text"
              name="location"
              className="form-control"
              value={searchData.location}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label  className="form-label">
              Description
            </label>
            <input
              type="text"
              name="description"
              className="form-control"
              value={searchData.description}
              onChange={handleSearchDataChange}
            />
          </div>
          <div className="col-lg-3 col-md-6 col-12">
            <label className="form-label">
              Section
            </label>
            <input
              type="text"
              name="section"
              value={searchData.section}
              onChange={handleSearchDataChange}
              className="form-control"
            />
          </div>
          <div className="col-12 mt-4 text-center">
          <button onClick={search} className=" btn otjs-button otjs-button-blue" >Search</button>
          </div>
        </section> 
      </div>

      <section className="mt-5">
       {roles.add_store_location && <button className="ms-auto d-block my-3 btn otjs-button otjs-button-blue" onClick={toogleModal}>Add Location</button>}
        <LocationTable locations={data}
        changeHandler={changeHandler} 
        saveModal={saveModal}
        setDeletedId={setDeletedId}
        />
      </section>

      <Modal id='delete' show={deleteId?.id} onHide={()=>setDeletedId(null)} size='sm'>
          <Modal.Header closeButton>
              <h2 className='card-title'>Delete Vendor</h2>
          </Modal.Header>
          <Modal.Body className="text-center">
              Are You sure to delete {deleteId?.name} ?
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
    </div>
  );
};

export default Location;
