import { useEffect, useRef, useState } from "react";
import UsedItemTable from "./UsedItemTable";
import QRCode from "../../QRCode";
import ScanPopup from "../../ScanPopup";
import DownloadUsedItemExcel from "./DownloadUsedItemExcel";

const UsedItem = () => {
  const [data, setData] = useState([]);
  const [qr, setQr] = useState(null);
  const [scannig, setScanning] = useState(false);
  const [searchData, setSearchData] = useState({});
  const [otherData, setOtherData] = useState({});

  useEffect(() => {
    fetchReletedData();
    fetchData();
  },[]);

  const fetchReletedData = () => {
    fetch("/api/inventory/related-data")
      .then((res) => res.json())
      .then((res) => {
        setOtherData(res.data);
      });
  };

  const fetchData = () => {
    fetch("/api/inventory/used-inventory")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
      });
  };

  const search = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(searchData).toString();
    fetch("/api/inventory/used-inventory?" + queryString)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
      });
  };

  const handleSearchDataChange = (e) => {
    setSearchData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const Scan = () => {
    setScanning(true);
  };

  const scanResult = (id) => {
    const queryString = new URLSearchParams({ stock_id: id }).toString();
    fetch("/api/inventory/items?" + queryString)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setScanning(false);
      });
  };

  const handleClear=(e)=>{
    e.preventDefault();
    setSearchData({})
  }

  return (
    <>
      {qr && <QRCode value={qr} onClose={() => setQr(null)} />}
      {scannig && (
        <ScanPopup
          setScanning={setScanning}
          scanResult={scanResult}
          fps={10}
          qrbox={250}
          disableFlip={false}
          qrCodeSuccessCallback={scanResult}
        />
      )}
      <form onSubmit={search} class="container ">
        <h4 class="text-center">Used Item</h4>
        <br />
        <br />
        <div>
          <section className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Item Code</label>
              <input
                type="text"
                name="item_code"
                className="form-control"
                value={searchData.item_code||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                name="item_name"
                className="form-control"
                value={searchData.item_name||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Category</label>
              <input
                type="text"
                name="category"
                className="form-control"
                value={searchData.category||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Type</label>
              <input
                type="text"
                name="type"
                className="form-control"
                value={searchData.type||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Store Location</label>
              <select
                name="store_location"
                onChange={handleSearchDataChange}
                value={searchData.store_location||''}
                className="form-select"
              >
                <option value="" hidden>
                  select store location
                </option>
                {otherData?.location?.map(({ id, location }) => (
                  <option value={id}>{location}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">From Expiry Date</label>
              <input
                type="date"
                className="form-control"
                name="expiry_from"
                value={searchData.expiry_from||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">To Expiry Date</label>
              <input
                type="date"
                name="expiry_to"
                className="form-control"
                value={searchData.expiry_to||''}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Manufactur Name</label>
              <select
                name="manufacture"
                onChange={handleSearchDataChange}
                value={searchData.manufacture||''}
                className="form-select"
              >
                <option value="" hidden>
                  select manufacture
                </option>
                {otherData?.manufacture?.map(({ id, name }) => (
                  <option value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Vendor Name</label>
              <select
                name="vendor"
                onChange={handleSearchDataChange}
                className="form-select"
                value={searchData.vendor||''}
              >
                <option value="" hidden>
                  select vendor
                </option>
                {otherData?.vendor?.map(({ id, name }) => (
                  <option value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Category</label>
              <select
                name="category"
                onChange={handleSearchDataChange}
                className="form-select"
                value={searchData.category||''}
              >
                <option value="" hidden>
                  select category
                </option>
                {otherData?.category?.map(({ id, name }) => (
                  <option value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">Stock ID</label>
              <input
                type="text"
                name="stock_id"
                className="form-control"
                value={searchData.stock_id}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <br />
              <button
                onClick={Scan}
                className=" btn otjs-button otjs-button-blue"
              >
                <i class="fas fa-qrcode"></i> Scan QR
              </button>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">From Created At</label>
              <input
                type="date"
                className="form-control"
                name="created_from"
                value={data.created_from}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label">To Created At</label>
              <input
                type="date"
                name="created_to"
                className="form-control"
                value={data.created_to}
                onChange={handleSearchDataChange}
              />
            </div>
            <div className="col-12 mt-5 text-center">
              <button className=" btn otjs-button otjs-button-blue">
                Search
              </button>
              <button type="button" onClick={handleClear} className="btn otjs-button otjs-button-orange p-2 ms-4" >Clear</button>
            </div>
          </section>
        </div>
      </form>

      <section className="mt-5">
        <div className="ms-auto text-end d-block mb-4">
          <DownloadUsedItemExcel data={data} />
        </div>
        <UsedItemTable setQr={setQr} inventory={data} />
      </section>
    </>
  );
};

export default UsedItem;
