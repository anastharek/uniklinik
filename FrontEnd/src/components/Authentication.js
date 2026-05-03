import React, { Component } from "react";

import apis from "../services/apis";
import { CSSTransition } from "react-transition-group";

import ReactTooltip from "react-tooltip";
import SweetAlert from "react-bootstrap-sweetalert";
import Lock from "@material-ui/icons/Lock";
import Person from "@material-ui/icons/Person";
import { toast } from "react-toastify";
import padilogo from "../assets/images/padi-logo-transparent.png";
import { Link } from "react-router-dom";

export default class Authentication extends Component {
  state = {
    username: "",
    password: "",
    errorMessage: undefined,
    show: false,
    showPopup: false,
  };

  componentDidMount = () => {
    if(!window.location.pathname.includes('login')){
      window.location.href='/login'
    }
    this.setState({
      show: true,
    });
    localStorage.removeItem("previous_user_data");
    localStorage.removeItem("previous_user_key");
    localStorage.removeItem("previous_user_value");
    localStorage.removeItem("previous_admin_data");
    localStorage.removeItem("previous_admin_key");
    localStorage.removeItem("previous_admin_value");
  };

  handleClick = async () => {
    let answer;
    try {
      answer = await apis.authentication.logIn(
        this.state.username,
        this.state.password
      );
    } catch (error) {
      toast.error(error);
    }

    if (answer.errorMessage != null) {
      this.setState({
        errorMessage: answer.errorMessage,
      });
    } else {
      if (answer.already) {
        this.setState({ res: answer, showPopup: true });
      } else {
      this.props.onLogin(answer);
      }
    }
  };

  makeLogin = () => {
    this.props.onLogin(this.state.res);
  };
  handleChange = (event) => {
    const target = event.target;
    const name = target.name;
    const value = target.type === "checkbox" ? target.checked : target.value;
    this.setState({
      [name]: value,
    });
  };

  /**
   * Redirect press enter to login button
   * @param {*} event
   */
  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      this.handleClick();
    }
  };

  render = () => {
    return (
      <>
        {this.state.showPopup && (
          <SweetAlert
            warning
            showCancel
            confirmBtnText="Yes, countinue !"
            confirmBtnBsStyle="danger"
            title="All other devices will be loggedout !!"
            onConfirm={this.makeLogin}
            onCancel={() => {
              this.setState({ showPopup: false });
            }}
            focusCancelBtn
          ></SweetAlert>
        )}

        <CSSTransition in={this.state.show} timeout={1500} classNames="auth">
          <div className="vertical-center authentification">
            <div className="text-center" id="login">
              <img
                src={padilogo}
                id="logo-login"
                height="200"
                text-align="center"
              ></img>
              <div
                className="alert alert-danger"
                id="error"
                style={{
                  display: this.state.errorMessage === undefined ? "none" : "",
                }}
              >
                {this.state.errorMessage}
              </div>
              <div className="block-content block block-400">
                <form id="login-form" onKeyPress={this.handleKeyDown}>
                  <fieldset>
                    <label>
                      <Person />
                    </label>
                    <input
                      type="text"
                      placeholder="PACs Username"
                      name="username"
                      value={this.state.username.value}
                      onChange={this.handleChange}
                      required
                    />
                  </fieldset>

                  <fieldset>
                    <label>
                      <Lock />
                    </label>
                    <input
                      type="password"
                      placeholder="Password"
                      name="password"
                      value={this.state.password.value}
                      onChange={this.handleChange}
                      required
                    />
                  </fieldset>

                  <div className="r-and-f">
                    <div>
                      <a
                        style={{ color: "#636A6E" }}
                        target="_blank"
                        href="/forgot-password"
                      >
                        <label
                          style={{ fontStyle: "italic", cursor: "pointer" }}
                        >
                          Forgot Password?
                        </label>
                      </a>
                    </div>

                    <div>
                      <Link to={"/register"}>
                        <label
                          style={{ fontStyle: "italic", cursor: "pointer" }}
                        >
                          {" "}
                          Create new account
                        </label>
                      </Link>
                    </div>
                  </div>

                  <button
                    name="connexion"
                    type="button"
                    className="login-btn"
                    onClick={this.handleClick}
                  >
                    {" "}
                    Login{" "}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </CSSTransition>
      </>
    );
  };
}
