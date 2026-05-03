import React, { Component } from "react";
import { Link, Redirect, Route, Switch, withRouter } from "react-router-dom";
import ToolsPanel from "./ToolsPanel";
import { Image, Nav, Navbar } from "react-bootstrap";

import { CSSTransition, TransitionGroup } from "react-transition-group";

import Footer from "./Footer";
import Query from "../Query/Components/Query";
import AutoQueryRoot from "../AutoQuery/Connected_Component/AutoQueryRoot";
import RobotView from "../AutoQuery/Connected_Component/RobotView";
import AdminRootPanel from "../Admin/AdminRootPanel";
import MonitoringRoot from "../Monitoring/MonitoringRoot";
import ImportRootPanel from "../Import/ImportRootPanel";
import ContentRootPanel from "../OrthancContent/ContentRootPanel";
import ExportPanel from "../Export/ExportPanel";
import AnonRootPanel from "../Anonymize/AnonRootPanel";
import Delete from "../Delete/Delete";
import CDBurner from "./../CDBurner/CDBurner";
import MyDicom from "../MyDicom/MyDicom";
import DicomRouterPanel from "../Dicom Router/DicomRouterPanel";
import { CreateReportView } from "../CreateReport/CreateReportView";
import CreateRequestScan from "../RequestScan/CreateRequestScan";
import RequestScanList from "../RequestScan/RequestScanList";

//added by rishabh 12-6-2022
import CreateReport from "../Reports/CreateReport";
import ViewReport from "../Reports/ViewReport";
import RequestReport from "../Reports/RequestReport";

//added by rishabh 28-6-2022
import RequestAdvanceImagin from "../Reports/RequestAdvanceImagin";

//request report
import RequestReportList from "../RequestReportList/RequestReportList";
import Addendun from "../Reports/Addendun";

//added by rishabh 29/7/22
import RequestAdvanceImaginList from "../RequestAdvImagin/RequestAdvanceImaginList";
import DoctorCaseList from "../CaseList/DoctorCaseList";
import AdminCaseList from "../CaseList/AdminCaseList";
import RequestScanCalender from "../RequestScan/RequestScanCalender";

import InventoryMonitoringRoot from "../InventoryMonitoring/InventoryMonitoring";

import DoctorProfile from "../DoctorProfile";
import socket from "../../socket/socket";
import Demographic from "../Demographic";
import RequestFeatureListPage from "../RequestFeature";
import { toast } from "react-toastify";
import BrowseDataset from "../Dataverse/BrowsDataset";
import MyDataset from "../Dataverse/MyDataset/MyDatasetRoot";
import Patient from "../Patient";
import PadiLabel from "../PadiLabel";
import apis from "../../services/apis";

const RESPONSIVE_LIMIT = 992;
export default class NavBar extends Component {
   constructor(props) {
    super(props);
    this.state = {
      currentTabSelect: null,
      opened: false,
      padilabels: []
    };
  }
  componentDidMount = async () => {
    this.setState({
      navbar:
        document.documentElement.clientWidth < RESPONSIVE_LIMIT
          ? "responsive"
          : "classique",
      currentTabSelect: "content",
    });

    window.addEventListener("resize", () => {
      const size = document.documentElement.clientWidth;
      this.setState({
        navbar: size < RESPONSIVE_LIMIT ? "responsive" : "classique",
      });
    });
    socket.emit("setname", { username: this.props.username }); //concurrent tukar
    socket.on("logOut", () => {
     this.props.onLogout();
    });
    socket.on('notification',({message,type,key})=>{
      if(type==='error'){
        toast.error(message);
      }else{
        toast.success(message);
      }
      if(key){
        localStorage.removeItem(key);
      }
    });
    apis.padilabels.getByRole()
    .then((response) => {
        this.setState({ padilabels: response.data });
    })
    .catch((error) => {
        console.error("Error fetching padi labels:", error);
    });
  };
  componentWillUnmount() {
    socket.off("logOut");
  }
  getLinkClass = (tabName) => {
    if (this.state.currentTabSelect === tabName) return "nav-link active";
    else return "nav-link";
  };

  selectTabHandler = (event) => {
    let target = event.target;
    this.setState({
      currentTabSelect: target.name,
    });
  };

  render = () => {
    return (
      <>
      <div id="popupContainer" style={{position:'absolute'}}>
      </div>
      <div className="app">
        <Navbar id="navbar" expand="md" variant="dark">
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto nav-links-main">
              <div
                className="otjs-navbar-border"
                hidden={!this.state.opened}
              ></div>
              <Link
                className={this.getLinkClass("content")}
                onClick={this.selectTabHandler}
                name="content"
                to="/padimedical-content"
                hidden={!this.props.roles.content}
              >
                Search Patient{" "}
                {/*tukar header - disable myDICOM, CD Burner, Query, Auto Retrieve, Dicom router */}
              </Link>
              {this.state?.padilabels?.map((label) => (
               <Link
                  key={label.id}
                  className={this.getLinkClass(`padi-label-${label.id}`)}
                  onClick={this.selectTabHandler}
                  name={`padi-label-${label.id}`}
                  to={`/padi-label/${label.path}`}
                >
                  {label.label}
                </Link>
              ))}
              <Link
                className={this.getLinkClass("patient")}
                onClick={this.selectTabHandler}
                name="patient"
                to="/patient"
                hidden={this.props.roles.name!=="patient"}
              >
                Patient
              </Link>
              <Link
                className={this.getLinkClass("admin-case-list")}
                onClick={this.selectTabHandler}
                name="admin-case-list"
                to="/admin-case-list"
                hidden={!this.props.roles.can_view_admin_caselist}
              >
                Trace Report {/*tukar header - all case list to trace report */}
              </Link>
              <Link
                className={this.getLinkClass("import")}
                onClick={this.selectTabHandler}
                name="import"
                to="/import"
                hidden={!this.props.roles.import}
              >
                Upload
              </Link>
              {/* <Link
                className={this.getLinkClass("query")}
                onClick={this.selectTabHandler}
                name="query"
                to="/query"
                hidden={!this.props.roles.query}
              >
                Query
              </Link>
              <Link
                className={this.getLinkClass("auto-query")}
                onClick={this.selectTabHandler}
                name="auto-query"
                to="/auto-query"
                hidden={!this.props.roles.auto_query}
              >
                Auto-Retrieve
              </Link> */}
              {/* <Link
                className={this.getLinkClass("burner")}
                onClick={this.selectTabHandler}
                name="burner"
                to="/cd-burner"
                hidden={!this.props.roles.cd_burner}
              >
                CD-burner
              </Link> */}
              {/* <Link
                className={this.getLinkClass("mydicom")}
                onClick={this.selectTabHandler}
                name="mydicom"
                to="/mydicom"
              >
                MyDicom
              </Link> */}
              <Link
                className={this.getLinkClass("create-report")}
                onClick={this.selectTabHandler}
                name="create-report"
                to="/create-report"
                hidden={!this.props.roles.create_report}
              >
                Create Study
              </Link>
              <Link
                className={this.getLinkClass("create-request-scan")}
                onClick={this.selectTabHandler}
                name="create-request-scan"
                to="/create-request-scan"
                hidden={!this.props.roles.request_scan}
              >
                Request Scan
              </Link>
              <Link
                className={this.getLinkClass("request-scan-calender")}
                onClick={this.selectTabHandler}
                name="request-scan-calender"
                to="/request-scan-calender"
                hidden={!this.props.roles.request_scan_calender}
              >
                Request Scan Calendar
              </Link>
              <Link
                className={this.getLinkClass("request-scan-list")}
                onClick={this.selectTabHandler}
                name="request-scan-list"
                to="/request-scan-list"
                hidden={!this.props.roles.request_scan_list}
              >
                Request Scan List
              </Link>
              <Link
                className={this.getLinkClass("request-feature-list")}
                onClick={this.selectTabHandler}
                name="request-feature-list"
                to="/request-feature-list"
                hidden={(!this.props.roles.can_view_request_feature || this.props.roles.name=='guest')}
              >
                Request Feature List
              </Link>
              <Link
                className={this.getLinkClass("my-case-list")}
                onClick={this.selectTabHandler}
                name="my-case-list"
                to="/my-case-list"
                hidden={!this.props.roles.can_view_assign_caselist}
              >
                My Case List
              </Link>
              <Link
                className={this.getLinkClass("dataverse")}
                onClick={this.selectTabHandler}
                name="dataverse"
                to="/dataverse-dashboard"
                hidden={!this.props.roles.view_dataset}
              >
                Dataverse{" "}
                {/*tukar header - disable myDICOM, CD Burner, Query, Auto Retrieve, Dicom router */}
              </Link>
              <Link
                className={this.getLinkClass("my-dataset")}
                onClick={this.selectTabHandler}
                name="my-dataset"
                to="/my-dataset"
                hidden={!this.props.roles.view_my_dataset}
              >
                My Dataset
              </Link>

              <Link
                className={this.getLinkClass("request-report-list")}
                onClick={this.selectTabHandler}
                name="request-report-list"
                to="/request-report-list"
                hidden={!this.props.roles.view_request_report}
              >
                Request Report List
              </Link>
              <Link
                className={this.getLinkClass("advance-report-imaging")}
                onClick={this.selectTabHandler}
                name="advance-report-imaging"
                to="/advance-report-imagin"
                hidden={!this.props.roles.view_imagin}
              >
                Advance Imaging List
              </Link>
              {/* <Link
                className={this.getLinkClass("dicom-router")}
                onClick={this.selectTabHandler}
                name="dicom-router"
                to="/dicom-router"
                hidden={!this.props.roles.autorouting}
              >
                Dicom-Router
              </Link> */}
              <Link
                className={this.getLinkClass("dashboard")}
                onClick={this.selectTabHandler}
                name="dashboard"
                to="/dashboard"
                hidden={this.props.roles.name=='guest'}
              >
                Dashboard
              </Link>
              <Link
                className={this.getLinkClass("inventory-monitoring")}
                onClick={this.selectTabHandler}
                name="inventory-monitoring"
                to="/inventory-monitoring"
                hidden={!this.props.roles.view_inventory}
              >
                Inventory Monitoring
              </Link>
              <Link
                className={this.getLinkClass("demographic")}
                onClick={this.selectTabHandler}
                name="demographic"
                to="/demographic"
                hidden={!this.props.roles.can_view_demographic}
               
              >
                Demographic
              </Link>
              <Link
                className={this.getLinkClass("administration")}
                onClick={this.selectTabHandler}
                name="administration"
                to="/administration"
                hidden={!this.props.roles.admin}
              >
                Administration
              </Link>
              <div
                className="otjs-navbar-border"
                hidden={!this.state.opened}
              ></div>
              <Link
                id="logout"
                className={this.getLinkClass("log-out")}
                name="log-out"
                onClick={()=>{socket.emit('remove-me');this.props.onLogout();}}
                to="/"
              >
                Log out
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="toolsPanel">
          <ToolsPanel roles={this.props.roles} apercu={true} />
        </div>
        {this.state.currentTabSelect === null ? (
          this.props.roles.name === "guest" ? (
            <Redirect to="/dataverse-dashboard" />
          ) : this.props.roles.name === "patient" ? (
            <Redirect to="/patient" />
          ) : (
            <Redirect to="/padimedical-content" />
          )
        ) : null}
        <AnimatedSwitch padilabels={this.state.padilabels} opened={this.state.opened} />

        <Footer />
      </div>
      </>
    );
  };
}

const AnimatedSwitch = withRouter(({ padilabels, location, ...props }) => (
  <TransitionGroup>
    <CSSTransition
      key={location.key}
      timeout={500}
      unmountOnExit
      classNames={"alert"}
    >
      <Switch location={location}>
      <Route exact path="/patient" component={Patient} />
      <div id={"main"} className={location.pathname=="/dataverse"?"":"main"}>
          <Route
            exact
            path="/padimedical-content"
            component={ContentRootPanel}
          />
          
          <Route 
            exact
            path={`/padi-label/*`}
            render={(props) => <PadiLabel {...props} data={padilabels} />}
          />
          <Route exact path="/dataverse-dashboard" component={BrowseDataset} />
          <Route exact path="/my-dataset" component={MyDataset} />
          <Route exact path="/import" component={ImportRootPanel} />
          <Route exact path="/query" component={Query} />
          <Route exact path="/auto-query" component={AutoQueryRoot} />
          <Route exact path="/administration" component={AdminRootPanel} />
          <Route exact path="/dashboard" component={MonitoringRoot} />
          <Route exact path="/inventory-monitoring" component={InventoryMonitoringRoot} />
          <Route
            exact
            path="/robot/:id"
            render={(props) => <RobotView id={props.match.params.id} />}
          />
          <Route exact path="/export" component={ExportPanel} />
          <Route exact path="/anonymize" component={AnonRootPanel} />
          <Route exact path="/cd-burner" component={CDBurner} />
          <Route exact path="/mydicom" component={MyDicom} />
          <Route exact path="/create-report" component={CreateReportView} />
          <Route
            exact
            path="/request-report-list"
            component={RequestReportList}
          />
          <Route
            exact
            path="/advance-report-imagin"
            component={RequestAdvanceImaginList}
          />
          <Route exact path="/delete" component={Delete} />
          <Route exact path="/dicom-router" component={DicomRouterPanel} />
          <Route exact path="/report/create/:id" component={CreateReport} />
          <Route exact path="/report/view/:id" component={ViewReport} />
          <Route exact path="/report/request/:id" component={RequestReport} />
          <Route exact path="/request-feature-list" component={RequestFeatureListPage} />
          <Route
            exact
            path="/report/request-advance-imagin/:id"
            component={RequestAdvanceImagin}
          />
          <Route exact path="/report/addendun/:id" component={Addendun} />
          <Route exact path="/my-case-list" component={DoctorCaseList} />
          <Route exact path="/admin-case-list" component={AdminCaseList} />
          <Route exact path="/demographic" component={Demographic} />
          <Route
            exact
            path="/create-request-scan"
            component={CreateRequestScan}
          />
          <Route
            exact
            path="/request-scan-calender"
            component={RequestScanCalender}
          />
          <Route exact path="/request-scan-list" component={RequestScanList} />
          <Route exact path="/doctor-profile/:username" component={DoctorProfile} />
        
      </div>
      </Switch>
    </CSSTransition>
  </TransitionGroup>
));
