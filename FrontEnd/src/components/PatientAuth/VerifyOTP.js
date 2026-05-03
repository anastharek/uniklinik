import React, { useEffect } from "react";
import apis from "../../services/apis";
import { CSSTransition } from "react-transition-group";
import { Sms } from "@material-ui/icons";
import padilogo from "../../assets/images/padi-logo-transparent.png";
import { toast } from "react-toastify";
import { useLocation,useHistory } from "react-router-dom";
import { login } from "../../actions/login";
import { useDispatch } from "react-redux";

const VerifyOTP = () => {
  const [otp, setOtp] = React.useState("");
  const location = useLocation();
  const [timer,setTimer]=React.useState(0);
  const timerRef=React.useRef(null);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const data = location.state;
  const handleClick = (e) => {
    e.preventDefault();
    apis.authenticationPatient
      .verifyOTP(
        data.patientId,
        data.contact,
        otp
      )
      .then((response) => {
        dispatch(login(response.data));
        toast.success("OTP verified successfully!");
        history.push({
          pathname: "/patient"
        });
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to verify OTP. Please try again.");
      });
  };

  const handleChange = (e) => {
    setOtp(e.target.value);
  };

  const startTimer = () => {
    setTimer(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimer((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }

  const handleResend = (e) => {
    e.preventDefault();
    apis.authenticationPatient
      .sendOtp(data.patientId, data.email)
      .then((response) => {
        toast.success("OTP sent successfully to your email !!");
        startTimer();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Error sending OTP");
      });
  }
  return (
    <CSSTransition timeout={1500} classNames="auth">
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
                  <Sms />
                </label>
                <input
                  type="text"
                  placeholder="Enter your OTP"
                  name="otp"
                  onChange={handleChange}
                  required
                />
              </fieldset>
              <div className="r-and-f">
                <button
                 style={{fontStyle: "italic", cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "#636A6E",
                  textDecoration: "underline",
                  opacity: timer > 0 ? 0.5 : 1,
                  }}
                  disabled={timer > 0}
                  type="button"
                  onClick={handleResend}
                >
                  Resend OTP {timer > 0 ? `IN (${timer}s)` : ""}
                </button>
              </div>

              <button
                name="connexion"
                type="submit"
                className="login-btn"
                onClick={handleClick}
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default VerifyOTP;
