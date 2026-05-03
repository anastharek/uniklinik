const AddManufactureModal = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000a8",
        position: "fixed",
        top: 0,
        left: 0,
        display:'flex',
        justifyContent:'center',
        alignItems:'center'
      }}
    >
      <form className="px-5 py-4 rounded" style={{background:'#fff',width:'100%',maxWidth:400,}}>
      <h5 class="text-center mb-3">Add New Manufacture</h5>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Name
            </label>
            <input
              type="text"
              name="part_number"
              id="part_number"
              className="form-control"
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              Address
            </label>
            <textarea
              type="text"
              name="part_number"
              id="part_number"
              className="form-control"
            >
            </textarea>
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
             Phone No.
            </label>
            <input
              type="text"
              name="part_number"
              id="part_number"
              className="form-control"
            />
          </div>
          <div className="col-12 mt-1">
            <label htmlFor="lastName" className="form-label">
              SSM
            </label>
            <input
              type="text"
              name="part_number"
              id="part_number"
              className="form-control"
            />
          </div>

          <section className="d-flex justify-content-between w-100 mt-3">
          <button className=" btn otjs-button otjs-button-blue" >Save</button>
          <button className=" btn otjs-button otjs-btn-tools-red" >Cancel</button>
        </section>
      </form>
    </div>
  );
};

export default AddManufactureModal;
