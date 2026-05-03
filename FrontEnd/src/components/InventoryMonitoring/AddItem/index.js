import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import QRCode from "../../QRCode";
const AddItem = () => {
  const [data, setData] = useState({ type: "general" });
  const [otherData, setOtherData] = useState({});
  const [suggest,setSuggest]=useState([]);
  const itemNameRef=useRef();
  const [qr,setQr]=useState(null)

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(()=>{
    if(data.cost_per_unit,data.unit_quantity){
      setData(prev=>({...prev,total_cost:data.cost_per_unit*data.unit_quantity}))
    }
  },[data.cost_per_unit,data.unit_quantity])
  const fetchData = () => {
    fetch("/api/inventory/related-data")
      .then((res) => res.json())
      .then((res) => {
        setOtherData(res.data);
      });
  };

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/inventory/create-item", {
      method: "post",
      body: JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
    })
    .then((res)=>{
      if(res.status==200){
        toast.success('item saved !!')
      }
      return res.json()
    })
    .then((res)=>{
      ///console.log({res.data.id})
    setData(res.data)
    })
  };

  const showApply=useCallback(()=>{
    const queryString = new URLSearchParams({item_name:data.item_name}).toString();
    fetch('/api/inventory/items-distinct?'+queryString)
    .then(res=>res.json())
    .then(res=>{
      if(!res.data.length){
        toast.warning('no inventory item found')
      }
     setSuggest(res.data)
    })
  },[data.item_name])

  const onSelectItem=(e)=>{
    e.preventDefault();
    let selectedID=e.target.value;
    let temp=suggest.filter(({id})=>id==selectedID)[0];
    if(temp){
      delete temp.id;
      delete temp.stock_id;
      delete temp.min_qty;
      delete temp.createdAt;
      delete temp.updatedAt;
      delete temp.expiry_date
      setData(temp);
      setSuggest([]);
    }
  }


  return (
    <>
    {qr && <QRCode value={qr} onClose={()=>setQr(null)}/>}
   
    <div class="">
      <h4 class="text-center">ADD ITEM</h4>
      <br />
      <br />
      <form onSubmit={handleSubmit}>
        <section className="row">
          <div className="col-lg-4 col-12">
            <label htmlFor="item_code" className="form-label">
              Item Code
            </label>
            <input
              type="text"
              name="item_code"
              id="item_code"
              className="form-control"
              value={data.item_code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-lg-4 col-12">
            <label className="form-label">
            Item Name
            </label>
            <div className="d-flex btn-sm">
            <input list="browsers"  
              type="text"
              name="item_name"
              id="item_name"
              ref={itemNameRef}
              className="form-control"
              value={data.item_name}
              onChange={handleChange}
              required/>
              <button type="button" onClick={showApply} className="btn btn-primary">Suggest</button>
            </div>
            {suggest.length ?
            <select onChange={onSelectItem}  className="form-select" >
              <option hidden>please select option</option>
             {suggest.map(({item_name,id,item_code})=>(<option value={id} >{item_name}  ({item_code})</option>))} 
            </select>
            :null}
          </div>
          <div className="col-lg-4 col-12">
            <label htmlFor="expiry" className="form-label">
              Expiration Date
            </label>
            <input
              type="date"
              name="expiry_date"
              required
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col-12">
            <label htmlFor="item-description" className="form-label">
              Item Description
            </label>
            <textarea
              type="text"
              name="item_description"
              id="description"
              className="form-control"
              value={data.item_description}
              onChange={handleChange}
            ></textarea>
          </div>
        </section>

        <section className="row mt-1">
          <div className="col-lg-4 col-12">
            <label className="form-label">Manufacture Name</label>
            <select
              name="manufacture"
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" hidden>
                select manufacture
              </option>
              {otherData?.manufacture?.map(({ id, name }) => (
                <option  selected={data.manufacture==id}  value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="col-lg-4 col-12">
            <label className="form-label">Categories</label>
            <select
              name="category"
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" hidden>
                select category
              </option>
              {otherData?.category?.map(({ id, name }) => (
                <option selected={data.category==id}  value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="col-lg-4 col-12">
            <label className="form-label">Vendor</label>
            <select
              name="vendor"
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" hidden>
                select vendor
              </option>
              {otherData?.vendor?.map(({ id, name }) => (
                <option selected={data.vendor==id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="col-lg-4 col-12 mt-1">
            <label htmlFor="store_location" className="form-label">
              Store Location
            </label>
            <select
              name="store_location"
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" hidden>
                select store location
              </option>
              {otherData?.location?.map(({ id, location }) => (
                <option  selected={data.store_location==id} value={id}>{location}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-5">
          <label className="form-label">
            <b>Type</b>
          </label>
          <br />
          <br />

          <label class="form-check-label ms-2">
            <input
              class="form-check-input"
              name="type"
              defaultChecked
              value={"general"}
              checked={data.type=='general'}
              onChange={handleChange}
              type="radio"
            />
            General
          </label>

          <label class="form-check-label ms-2">
            <input
              class="form-check-input ms-4"
              name="type"
              value="diagonastic"
              checked={data.type=='diagonastic'}
              onChange={handleChange}
              type="radio"
            />
            Diagonastic
          </label>

          <label class="form-check-label ms-2">
            <input
              class="form-check-input ms-4"
              name="type"
              id="interventional"
              value="interventional"
              checked={data.type=='interventional'}
              onChange={handleChange}
              type="radio"
            />
            Interventional
          </label>
        </section>

        <section className="row mt-5">
          <label className="form-label">
            <b>Pricing</b>
          </label>
          <br />
          <br />
          <div className="col-lg-4 col-12">
            <label htmlFor="lastName" className="form-label">
              Cost Per Unit
            </label>
            <input
              name="cost_per_unit"
              value={data.cost_per_unit}
              onChange={handleChange}
              type="text"
              className="form-control"
              required
            />
          </div>
          <div className="col-lg-4 col-12">
            <label htmlFor="lastName" className="form-label">
              Unit Quantity
            </label>
            <input
              type="text"
              name="unit_quantity"
              value={data.unit_quantity}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="col-lg-4 col-12">
            <label htmlFor="lastName" className="form-label">
              Total Cost
            </label>
            <input
              type="text"
              name="total_cost"
              value={data.total_cost}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </section>



        <section className="mt-5">
          {
            data.stock_id?
            <>
            <Button type="button" onClick={()=>{setQr(data.stock_id)}} className=" btn otjs-button otjs-button-orange">
            Show QR
          </Button>
            <Button type="button" onClick={()=>{setData({})}} className="ms-4 btn otjs-button otjs-button-green">
           Clear
          </Button>
          </>:
            <Button type="submit" className=" btn otjs-button otjs-button-blue">
            Save
          </Button>
          }
        
        </section>
      </form>
    </div>
    </>
  );
};

export default AddItem;
