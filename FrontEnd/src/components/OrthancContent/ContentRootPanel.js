import React, { Component, createRef } from "react";
import SearchForm from "./SearchForm";
import SendTo from "../CommonComponents/RessourcesDisplay/SendToAnonExportDeleteDropdown";
import apis from "../../services/apis";

import { Col, Row } from "react-bootstrap";

import TableSeriesFillFromParent from "../CommonComponents/RessourcesDisplay/TableSeriesFillFromParent";
import TablePatientsWithNestedStudies from "../CommonComponents/RessourcesDisplay/ReactTable/TablePatientsWithNestedStudies";
import { connect } from "react-redux";
import { addStudiesToDeleteList } from "../../actions/DeleteList";
import { addStudiesToExportList } from "../../actions/ExportList";
import { addStudiesToAnonList } from "../../actions/AnonList";
import { padimedicalContent } from "../../actions/PadiMedical";
import { blockToggle, empty_row } from "../../actions/PadiMedical";
import { toast } from "react-toastify";
import LabelDropdown from "./labels/LabelDropdown";
import LabelModal from "./labels/LabelModal";
import PatientStudyTable from "../CommonComponents/RessourcesDisplay/ReactTable/PatientStudyTable";

class ContentRootPanel extends Component {
  state = {
    currentSelectedStudyId: "",
    dataForm: {},
    orthancContent: [],
    selectedStudies: [],
    resultVisible: false,
    key: Math.random(),
  };

  modalRef = { open: null };

  constructor(props) {
    super(props);
    this.child = createRef();
  }

  componentDidMount() {
    this.props.blockToggle();
    this.setState(this.props.content_data, () => {
      this.props?.clicked_row?.map((element) => {
        let HTMLelement = document.getElementById(element);
        if (HTMLelement) {
          let name = HTMLelement.getElementsByTagName("span")[1];
          name && name.click();
        }
      });
      this.props.blockToggle();
    });
  }

  componentWillUnmount() {
    this.props.padimedicalContent(this.state);
  }

  sendSearch = async (dataForm) => {
    //Show result
    this.setState({ resultVisible: true });
    if (dataForm) {
      //Store new form find value and send request to back
      this.setState(
        {
          dataForm: dataForm,
          currentSelectedStudyId: "",
        },
        () => this.sendFindRequest(dataForm)
      );
    } else {
      //refresh value using the same current form search value
      this.sendFindRequest(this.state.dataForm);
    }
  };

  sendFindRequest = async (dataForm) => {
    try {
      let studies = await apis.content.getOrthancFind(dataForm);
      let status=await apis.content.getReportStatusByID(studies.map(obj=>obj.ID));
      studies=studies.map((obj,index)=>({...obj,ReportStatus:status[index]?'Finalize':status[index]==false?"Draft":"Pending"}))
      localStorage.setItem("refresh_table", true);
      this.setState(
        {
          orthancContent: studies,
          selectedStudies: [],
          key: Math.random(),
        },
        () => {
          this.refreshSerie();
          this.props.empty_row();
        }
      );
    } catch (error) {
      toast.error(error.statusText);
    }
  };

  refreshSerie = () => {
    let id = this.state.currentSelectedStudyId;
    this.setState({
      currentSelectedStudyId: "",
    });
    this.setState({
      currentSelectedStudyId: id,
    });
  };

  //Rappelé par le dropdown lors du delete de Patietn sur Orthanc
  onDeletePatient = (idDeleted) => {
    this.sendSearch();
    this.setState({ currentSelectedStudyId: "" });
  };

  //rappelé par le dropdow lors du delete de study sur Orthanc
  onDeleteStudy = (idDeleted) => {
    this.sendSearch();
    this.setState({ currentSelectedStudyId: "" });
  };

  rowEventsStudies = (ID) => {
    this.setState({ currentSelectedStudyId: ID });
  };

  rowStyleStudies = (row) => {
    const style = {};
    if (row.StudyOrthancID === this.state.currentSelectedStudyId) {
      style.backgroundColor = "rgba(255,153,51)";
    }
    style.borderTop = "none";

    return style;
  };

  getStudySelectedDetails = () => {
    let selectedIds = this.child.current.getSelectedRessources();
    let studiesOfSelectedPatients = [];
    //Add all studies of selected patient
    selectedIds.selectedPatients.forEach((orthancPatientId) => {
      //loop the redux and add all studies that had one of the selected patient ID
      let studyArray = this.state.orthancContent.filter(
        (study) => study.ParentPatient === orthancPatientId
      );
      //Add to the global list of selected studies
      studiesOfSelectedPatients.push(...studyArray);
    });

    //add selected level studies
    selectedIds.selectedStudies.forEach((element) => {
      this.state.orthancContent.forEach((study) => {
        if (element === study.ID) studiesOfSelectedPatients.push(study);
      });
    });
    //Get only unique study ids
    let uniqueSelectedOrthancStudyId = [...new Set(studiesOfSelectedPatients)];
    return uniqueSelectedOrthancStudyId;
  };

  setSelectedStudies = (resources) => {
    let selectedIds = resources;
    let studiesOfSelectedPatients = [];
    //Add all studies of selected patient
    selectedIds.selectedPatients.forEach((orthancPatientId) => {
      //loop the redux and add all studies that had one of the selected patient ID
      let studyArray = this.state.orthancContent.filter(
        (study) => study.ParentPatient === orthancPatientId
      );
      //Add to the global list of selected studies
      studiesOfSelectedPatients.push(...studyArray);
    });

    //add selected level studies
    selectedIds.selectedStudies.forEach((element) => {
      this.state.orthancContent.forEach((study) => {
        if (element === study.ID) studiesOfSelectedPatients.push(study);
      });
    });
    //Get only unique study ids
    let uniqueSelectedOrthancStudyId = [...new Set(studiesOfSelectedPatients)];
    this.setState({ selectedStudies: uniqueSelectedOrthancStudyId });
  };

  render = () => {
    return (
      <div>
        <SearchForm onSubmit={this.sendSearch} />
        <Row
          key={this.state.key}
          id="showResult"
          className={
            "mt-5" + (this.state.resultVisible ? " show-result-opened" : "")
          }
        >
          <Row>
            <Col sm={6}>
              <div className="d-flex flex-row justify-content-between mt-4">
                <SendTo studiesFull={this.state.selectedStudies} />
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm>
              <LabelModal fwRef={this.modalRef} />
              {/* <TablePatientsWithNestedStudies
                studies={this.state.orthancContent}
                rowEventsStudies={this.rowEventsStudies}
                rowStyle={this.rowStyleStudies}
                onDeletePatient={this.onDeletePatient}
                onDeleteStudy={this.onDeleteStudy}
                setSelectedStudies={this.setSelectedStudies}
                onModify={this.sendSearch}
                refresh={this.sendSearch}
                hiddenRemoveRow={true}
                openLabelModal={this.modalRef.open}
              /> */}
              <PatientStudyTable
                studies={this.state.orthancContent}
                rowEventsStudies={this.rowEventsStudies}
                rowStyle={this.rowStyleStudies}
                onDeletePatient={this.onDeletePatient}
                onDeleteStudy={this.onDeleteStudy}
                setSelectedStudies={this.setSelectedStudies}
                onModify={this.sendSearch}
                refresh={this.sendSearch}
                hiddenRemoveRow={true}
                openLabelModal={this.modalRef.open}
              />   
            </Col>
            <Col sm>
              
              <div className="series-area"></div>
              <TableSeriesFillFromParent
                studyID={this.state.currentSelectedStudyId}
                onDeleteStudy={this.onDeleteStudy}
                onEmptySeries={() => console.log("No Series")}
                refreshSerie={this.refreshSerie}
                refresh={this.refreshSerie}
              />
            </Col>
          </Row>
          <Row>
            <Col sm={6}>
              <div className="d-flex flex-row justify-content-between mt-4">
                <SendTo studiesFull={this.state.selectedStudies} />
              </div>
            </Col>
          </Row>
        </Row>
      </div>
    );
  };
}

const mapDispatchToProps = {
  addStudiesToDeleteList,
  addStudiesToAnonList,
  addStudiesToExportList,
  padimedicalContent,
  blockToggle,
  empty_row,
};

const mapStatetoProp = (state) => {
  return {
    content_data: state.PadiMedical.content_data,
    clicked_row: state.PadiMedical.clicked_row,
  };
};
export default connect(mapStatetoProp, mapDispatchToProps)(ContentRootPanel);
