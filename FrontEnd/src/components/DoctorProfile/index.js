import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
const DoctorProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState({});
  useEffect(() => {
    fetch("/api/users/profile/" + username)
      .then((res) => res.json())
      .then((res) => setProfile(res))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body text-center">
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "100%",
                  background: "grey",
                  overflow: "hidden",
                  margin: "10px auto",
                }}
              >
                <img
                  src={profile.profile_image}
                  height={120}
                  width={120}
                  class="rounded-circle mb-3"
                  alt="Profile Image"
                />
              </div>

              <h4 class="card-title">{profile.username}</h4>

              <p
                style={{ fontWeight: "bold", textTransform: "capitalize" }}
                className="card-text "
              >
                {" "}
                Name: {profile.firstname} {profile.lastname}
              </p>

              <p style={{ fontWeight: "bold" }} className="card-text">
                {" "}
                Email: {profile.email}
              </p>
              <p style={{ fontWeight: "bold" }} className="card-text">
                {" "}
                Phone: {profile.phone}
              </p>
              <p
                style={{ fontWeight: "bold", textTransform: "capitalize" }}
                className="card-text"
              >
                {" "}
                Practicing No: {profile.practicing_no}{" "}
              </p>
              <p
                style={{ fontWeight: "bold", textTransform: "capitalize" }}
                className="card-text"
              >
                {" "}
                Place of practice: {profile.place}
              </p>
              <p
                style={{ fontWeight: "bold", textTransform: "capitalize" }}
                className="card-text"
              >
                {" "}
                Department: {profile.department}
              </p>

              <div class="card-footer">
                <img height={90} src={profile.signature} alt="Signature" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
