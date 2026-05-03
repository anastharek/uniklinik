import React, { Component } from "react";
import apis from "../../services/apis";
import { CSSTransition } from "react-transition-group";
import SweetAlert from "react-bootstrap-sweetalert";
import Lock from "@material-ui/icons/Lock";
import Person from "@material-ui/icons/Person";
import padilogo from "../../assets/images/padi-logo-transparent.png";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Call, Mail } from "@material-ui/icons";
import { useHistory } from "react-router-dom";

function detectType(input) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9\s\-()+]+$/;
  if (emailRegex.test(input)) {
    return 'email';
  } 
  else if (phoneRegex.test(input)) {
    return 'phone';
  } else {
    return 'unknown';
  }
}

const GetOTP = () => {
   const [data, setData] = React.useState({
    patientId: "",
    contact: "",
    });
    const history = useHistory();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    const handleClick = (e)=>{
      e.preventDefault();
      apis.authenticationPatient.sendOtp(data.patientId, data.contact)
      .then((response) => {
          toast.success("OTP sent successfully to your email !!");
          history.push({
            pathname: "/login/patient/otp",
            state: {
              patientId: data.patientId,
              contact: data.contact,
            },
          });
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message||"Error sending OTP");
      });
    }


    return (
        <CSSTransition  timeout={1500} classNames="auth">
        <div className="vertical-center authentification">
          <div className="text-center" id="login">
            <img
              src={padilogo}
              id="logo-login"
              height="200"
              text-align="center"
              alt="Padi Logo"
            ></img>
            {/* <div
              className="alert alert-danger"
              id="error"
              style={{
                display: this.state.errorMessage === undefined ? "none" : "",
              }}
            >
              {this.state.errorMessage}
            </div> */}
            <div className="block-content block block-400">

              <form onSubmit={handleClick} id="login-form">
                <fieldset>
                  <label>
                    <Person />
                  </label>
                  <input
                    type="text"
                    placeholder="Patient ID"
                    name="patientId"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    {detectType(data.contact) !== "phone" ? <Mail /> : <Call />}
                  </label>
                  <input
                    type="text"
                    placeholder="Email or Phone Number"
                    name="contact"
                    onChange={handleChange}
                    required
                  />
                </fieldset>
                <button
                  name="connexion"
                  type="submit"
                  className="login-btn"
                >
                  {" "}
                  Get OTP{" "}
                </button>
              </form>
            </div>
          </div>
        </div>
      </CSSTransition>
    )
}

export default GetOTP;