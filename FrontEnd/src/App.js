import React, { Component } from "react";

import { toast } from "react-toastify";
import fetchIntercept from "fetch-intercept";

import NavBar from "./components/Main/NavBar";
import Authentication from "./components/Authentication";

import { login, logout } from "./actions/login";
import { connect } from "react-redux";
import apis from "./services/apis";

//CSS Boostrap
import "bootstrap/dist/css/bootstrap.min.css";
//CSS Toastify
import "react-toastify/dist/ReactToastify.css";
//Custom CSS
import "./assets/styles/PadiMedicalJs.scss";
import { BrowserRouter, matchPath, Route, Switch } from "react-router-dom";
import { ExternalAccess } from "./components/ExternalAccess/ExternalAccess";

//pages
import Register from "./components/Register/Register";
import RegistrationSucess from "./components/Register/RegistrationSuccess";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import NewPassword from "./components/NewPassword/NewPassword";
import ExternalLink from "./components/ExternalLink/ExternalLink";
import BrowseDataset from "./components/Dataverse/BrowsDatasetPublic";
import ViewDataset from "./components/Dataverse/ViewDataset";
import GetOTP from "./components/PatientAuth/GetOTP";
import VerifyOTP from "./components/PatientAuth/VerifyOTP";
import PadiLabelPublic from "./components/PadiLabelPublic";

// Configuring Toastify params that will be used all over the app
toast.configure({
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});

class App extends Component {
  constructor(props) {
    super(props);

    fetchIntercept.register({
      request: function (url, config) {
        // Modify the url or config here
        return [url, config];
      },

      requestError: function (error) {
        // Called when an error occured during another 'request' interceptor call
        return Promise.reject(error);
      },

      response: async (response) => {
        if (
          response.status === 401 &&
          !response.url.includes("authentication")
        ) {
          toast.error("Session expired, please re-identify");
          await this.logout();
        }
        return response;
      },

      responseError: function (error) {
        return Promise.reject(error);
      },
    });
  }

  login = (logInAnwser) => {
    this.props.login(logInAnwser);
  };

  logout = async () => {
    this.props.logout(); //empty all reducer
    await apis.authentication.logOut(); //ask backend to reset cookie http only
  };

  render() {
    const { pathname } = window.location;
    const externalMatch = matchPath(pathname, {
      path: "/external/:viewer/:StudyInstanceId",
    });
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/login/patient" component={GetOTP} />
          {!this.props.username && <Route exact path="/padi-label" component={PadiLabelPublic} />}
          <Route exact path="/login/patient/otp" component={VerifyOTP} />
          <Route exact path="/register" component={Register} />
          <Route
            exact
            path="/register-success"
            component={RegistrationSucess}
          />
          <Route exact path="/forgot-password" component={ForgotPassword} />
          <Route exact path="/new-password/:token" component={NewPassword} />
          <Route exact path="/external-page" component={ExternalLink} />
          <Route exact path="/dataverse" component={BrowseDataset}/>
          <Route exact path="/dataverse/:dataset_id" component={ViewDataset}/>
          <Route
            exact
            path="/external/:viewer/:StudyInstanceId"
            component={(props) => (
              <ExternalAccess {...props} params={externalMatch?.params || {}} />
            )}
          />
          <Route path="*">
            {this.props.username ? (
              <NavBar
                onLogout={this.logout}
                username={this.props.username}
                roles={this.props.roles}
              />
            ) : (
              <Authentication onLogin={this.login} />
            )}
          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

const mapsDispatchToProps = {
  logout,
  login,
};

const mapStateToProps = (state) => {
  return {
    username: state.PadiMedical.username,
    roles: state.PadiMedical.roles,
  };
};

export default connect(mapStateToProps, mapsDispatchToProps)(App);
