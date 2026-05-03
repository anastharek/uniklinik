import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const PacAdmin = () => {
  const [profile, setProfile] = useState({});
  const isAdmin = useSelector((state) => state.PadiMedical.roles.admin);

  useEffect(() => {
    fetch("/api/pac-admin")
      .then((res) => res.json())
      .then((res) => setProfile(res[0] || {}));
  }, []);
  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/pac-admin", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "post",
      body: JSON.stringify(profile),
    }).then(() => {
      toast.success("saved !!");
    });
  };

  const onProfileChange = (e) => {
    var reader = new FileReader();
    reader.onloadend = function () {
      setProfile((prev) => ({ ...prev, profile: reader.result }));
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  return (
    <div class="container mt-5">
      <h4 class="text-center">PAC ADMIN PROFILE</h4>
      <form onSubmit={handleSubmit} className="row">
        <div className="col-12 mt-5">
          <div
            style={{ width: "150px" }}
            className="position-relative bg-light  m-auto rounded rounded-3"
          >
            {isAdmin && (
              <input
                type="file"
                name="profile"
                className="position-absolute w-100 h-100 opacity-0"
                onChange={onProfileChange}
              />
            )}
            <img src={profile.profile} width={150} height={150} />
          </div>

          <div className="col-md-8  m-auto col-xs-11">
            <div className="col-12 mt-2">
              <label>Name</label>
              <input
                className="form-control"
                name="name"
                value={profile.name}
                readOnly={!isAdmin}
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Email</label>
              <input
                className="form-control"
                name="email"
                readOnly={!isAdmin}
                onChange={handleChange}
                value={profile.email}
                placeholder="Email"
              />
            </div>
            <div className="col-12 mt-2">
              <label>Phone</label>
              <input
                className="form-control"
                name="phone_no"
                readOnly={!isAdmin}
                onChange={handleChange}
                value={profile.phone_no}
                placeholder="Phone"
              />
            </div>
          </div>
          {isAdmin && (
            <button className="btn btn otjs-button otjs-button-blue d-block  w-auto px-4 py-2 m-auto mt-5">
              Save Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PacAdmin;
