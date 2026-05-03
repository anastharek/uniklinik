import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CardShareButtonUpload } from "../../CardShare/CardShareUpload";

const Uploader = () => {
  const [profile, setProfile] = useState({});
  const roles = useSelector((state) => state.PadiMedical.roles);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData=()=>{
    fetch("/api/uploader")
      .then((res) => res.json())
      .then((res) => setProfile(res.user || {}));
  }
  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/uploader", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "post",
      body: JSON.stringify(profile),
    }).then((res) => {
        if(res.status==200){
            fetchData();
            toast.success("saved !!");  
        }
        return res.json()
      
    })
    .then((res)=>{
        if(res.errorMessage){
            toast.error(res.errorMessage)
        }
    })
  };

 
  return (
    <div class="container mt-5">
      <h4 class="text-center">UPLOADER</h4>
      <form onSubmit={handleSubmit} className="row">
        <div className="col-12 mt-5">
          <div className="col-md-8  m-auto col-xs-11">
            <div className="col-12 mt-2">
              <label>First Name</label>
              <input
                className="form-control"
                name="firstname"
                value={profile.firstname}
                onChange={handleChange}
                placeholder="First Name"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Last Name</label>
              <input
                className="form-control"
                name="lastname"
                value={profile.lastname}
                onChange={handleChange}
                placeholder="First Name"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Email</label>
              <input
                className="form-control"
                name="email"
                onChange={handleChange}
                value={profile.email}
                placeholder="Email"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Username</label>
              <input
                className="form-control"
                name="username"
                onChange={handleChange}
                value={profile.username}
                placeholder="Username"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Password</label>
              <input
                className="form-control"
                name="password"
                type="password"
                defaultValue={profile?.plain_password}
                onChange={handleChange}
                placeholder="Password"
              />
            </div>
          </div>
          <div className="col-md-8 mt-3  m-auto col-xs-11 d-flex justify-content-between">
            {roles.can_create_uploader && (
              <button className="btn btn otjs-button otjs-button-blue  w-auto ">
                Save Profile
              </button>
            )}
            <CardShareButtonUpload
              show={true}
              username={profile.username}
              password={profile.plain_password}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Uploader;
