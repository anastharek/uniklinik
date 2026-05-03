import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Delete } from "@material-ui/icons";
const Profile = () => {
  const [profile, setProfile] = useState({});
  useEffect(() => {
    fetch("/api/users/profile")
      .then((res) => res.json())
      .then((res) => setProfile(res))
      .catch((err) => console.log(err));
  }, []);

  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/users/profile", {
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
      setProfile((prev) => ({ ...prev, profile_image: reader.result }));
    };

    reader.readAsDataURL(e.target.files[0]);
  };

  const onSignatureChange = (e) => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onloadend = function () {
      setProfile((prev) => ({ ...prev, signature: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeSignature = () => {
    setProfile((prev) => ({ ...prev, signature: null }));
    fetch("/api/users/profile/signature", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      method: "DELETE",
    }).then(() => toast.success("removed signature !!"));
  };
  return (
    <div className="container">
      <div class="container mt-5">
        <h4 class="text-center">My Profile</h4>
        <br />
        <br />
        <form
          style={{ maxWidth: 800, margin: "auto" }}
          onSubmit={handleSubmit}
          className="row"
        >
          <div className=" row col-12">
            <div className="mt-3 col-6 justify-content-center">
              <div
                className="col-12 border-1 border h-100 
                m-auto
            justify-content-center 
            d-flex
            align-items-center
            bg-light
            rounded-4
            position-relative
            "
              >
                <input
                  type="file"
                  name="profile_image"
                  style={{ zIndex: 2 }}
                  onChange={onProfileChange}
                  className="opacity-0 position-absolute w-100 h-100  "
                />
                {profile.profile_image ? null : <b>Upload Profile</b>}
                <img
                  style={{ maxHeight: "180px" }}
                  src={profile.profile_image}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="mt-2">
                <label>First Name</label>
                <input
                  className="form-control"
                  name="firstname"
                  value={profile.firstname}
                  onChange={handleChange}
                  placeholder="First Name"
                />
              </div>
              <div className="mt-2">
                <label>Last Name</label>
                <input
                  className="form-control"
                  name="lastname"
                  onChange={handleChange}
                  value={profile.lastname}
                  placeholder="First Name"
                />
              </div>
              <div className="mt-2">
                <label>Username</label>
                <input
                  className="form-control"
                  name="username"
                  onChange={handleChange}
                  value={profile.username}
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="mt-2 col-6">
              <label>Email</label>
              <input
                className="form-control"
                value={profile.email}
                name="email"
                onChange={handleChange}
                placeholder="Email"
              />
            </div>
            <div className="mt-2 col-6">
              <label>Phone</label>
              <input
                className="form-control"
                value={profile.phone}
                name="phone"
                onChange={handleChange}
                placeholder="Phone"
              />
            </div>
            <div className="mt-2 col-6">
              <label>Practicing No</label>
              <input
                className="form-control"
                name="practicing_no"
                onChange={handleChange}
                value={profile.practicing_no}
                placeholder="Practicing No"
              />
            </div>
            <div className="mt-2 col-6">
              <label>Place of practice</label>
              <input
                className="form-control"
                name="place"
                onChange={handleChange}
                value={profile.place}
                placeholder="Place of practice"
              />
            </div>
            <div className="mt-2 col-6">
              <label>Department</label>
              <input
                className="form-control"
                name="department"
                onChange={handleChange}
                value={profile.department}
                placeholder="Department"
              />
            </div>
            <br />
            <div className="col-12"></div>
            <div className=" mt-2 col-6 pt-2">
              <div className="col-12">
                <label>Signature</label>
                <input
                  type="file"
                  onChange={onSignatureChange}
                  name="signature"
                  className="form-control"
                />
              </div>
              <div
                style={{ height: 100 }}
                className={`col-6 mt-4 ${
                  !profile.signature && "bg-light"
                }  justify-content-center d-flex align-items-center`}
              >
                {!profile.signature && "No Signature"}
                <img style={{ maxHeight: "100%" }} src={profile.signature} />
                {profile.signature && (
                  <button
                    type="button"
                    onClick={removeSignature}
                    className="btn"
                  >
                    <Delete style={{ color: "red" }} />
                  </button>
                )}
              </div>
            </div>
            <div className=" mt-2 col-6 pt-2">
              <label>Doctor Description</label>
              <textarea
                rows={5}
                value={profile.doctor_description}
                className="form-control"
                name="doctor_description"
                onChange={handleChange}
              ></textarea>
            </div>
            <button className="btn otjs-button otjs-button-blue w-auto px-4 py-2 m-auto mt-5">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
