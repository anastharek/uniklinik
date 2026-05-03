import React, { Component } from "react";
import { connect } from "react-redux";

import Dropzone from "react-dropzone";
// import ProgressBar from 'react-bootstrap/ProgressBar'
import {
  CircularProgressbar,
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import { Modal, Row, Col } from "react-bootstrap";

import TablePatientsWithNestedStudiesAndSeries from "../CommonComponents/RessourcesDisplay/ReactTable/TablePatientsWithNestedStudiesAndSeries";
import TableImportError from "./TableImportError";
import apis from "../../services/apis";
import {
  treeToPatientArray,
  treeToStudyArray,
} from "../../tools/processResponse";

import { addStudiesToExportList } from "../../actions/ExportList";
import { addStudiesToDeleteList } from "../../actions/DeleteList";
import { addStudiesToAnonList } from "../../actions/AnonList";
import { Prompt } from "react-router-dom";
import "react-circular-progressbar/dist/styles.css";
import Images from "../../assets/images/images-removebg.png";
import AnonExportDeleteSendButton from "./AnonExportDeleteSendButton";
import activity from "../../services/activity";
import "./style.css";

import _ from "lodash";

function Separator(props) {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        transform: `rotate(${props.turns}turn)`,
      }}
    >
      <div style={props.style} />
    </div>
  );
}

function RadialSeparators(props) {
  const turns = 1 / props.count;
  return _.range(props.count).map((index) => (
    <Separator turns={index * turns} style={props.style} />
  ));
}

class Import extends Component {
  state = {
    errors: [],
    patientsObjects: {},
    studiesObjects: {},
    seriesObjects: {},
    showErrors: false,
    inProgress: false,
    isDragging: false,
    numberOfFiles: 0,
    processedFiles: 0,
  };

  cancelImport = false;

  __pFileReader = (file) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.readAsArrayBuffer(file);
      fr.onload = () => {
        resolve(fr);
      };
    });
  };

  addFile = async (files) => {
    this.setState({
      isDragging: false,
      inProgress: true,
      numberOfFiles: files.length,
      processedFiles: 0,
    });
    let i = 1;
    for (let file of files) {
      if (this.cancelImport) {
        console.log("Upload Interrupted");
        return;
      }

      await this.__pFileReader(file).then(async (reader) => {
        const stringBuffer = new Uint8Array(reader.result);

        try {
          let response = await apis.importDicom.importDicom(stringBuffer);
          await this.addUploadedFileToState(response);
        } catch (error) {
          this.addErrorToState(file.name, error.statusText);
        }
      });
      this.setState((state) => {
        return { processedFiles: ++state.processedFiles };
      });
      i = ++i;
    }

    this.setState({ inProgress: false });
  };

  componentWillUnmount = () => {
    this.cancelImport = true;
  };


  /**
   * add a failed import in error list
   * @param {string} fileID
   * @param {string} file
   * @param {string} error
   */
  addErrorToState = (filename, error) => {
    let errors = this.state.errors;
    errors.push({
      fileID: Math.random(),
      filename: filename,
      error: error,
    });

    this.setState({
      errors: errors,
    });
  };

  addUploadedFileToState = async (orthancAnswer) => {
    console.log({ orthancAnswer });
    let isExistingSerie = this.isKnownSeries(orthancAnswer.ParentSeries);

    if (isExistingSerie) {
      this.setState((state) => {
        state.seriesObjects[orthancAnswer.ParentSeries]["Instances"]++;
        return state;
      });
      return;
    }

    let isExistingStudy = this.isKnownStudy(orthancAnswer.ParentStudy);

    if (!isExistingStudy) {
      let studyDetails = await apis.content.getStudiesDetails(
        orthancAnswer.ParentStudy
      );
      let patient_name = studyDetails.PatientMainDicomTags.PatientName;
      let patient_id = studyDetails.PatientMainDicomTags.PatientID;
      let StudyInstanceUID = studyDetails.MainDicomTags.StudyInstanceUID;
      let study_date=studyDetails.MainDicomTags.StudyDate;
      let study_id=studyDetails.ID;
      let study_type=studyDetails?.MainDicomTags?.StudyDescription||'';
      let doctors= [this.props.roles.uploader_of? `Dr.  ${this.props.roles.uploader_of_name} (${this.props.roles.uploader_of})`:  `Dr.  ${this.props.roles.firstname} (${this.props.roles.username})`]
      let accesor=studyDetails.MainDicomTags.AccessionNumber;
      apis.caseList
      .assignDoctor(
        study_id,
        patient_name,
        patient_id,
        accesor,
        study_type,
        study_date,
        doctors,
        StudyInstanceUID
      )
      activity.create_activity("IMPORT", { patient_name, patient_id });
      this.addStudyToState(studyDetails);
    }

    let seriesDetails = await apis.content.getSeriesDetailsByID(
      orthancAnswer.ParentSeries
    );
    this.addSeriesToState(seriesDetails);
  };

  addStudyToState = (studyDetails) => {
    this.setState((state) => {
      state.studiesObjects[studyDetails.ID] = studyDetails;
      state.patientsObjects[studyDetails.ParentPatient] =
        studyDetails.PatientMainDicomTags;
      return state;
    });
  };

  addSeriesToState = (seriesDetails) => {
    this.setState((state) => {
      state.seriesObjects[seriesDetails.ID] = {
        ...seriesDetails,
        Instances: 1,
      };
      return state;
    });
  };

  buildImportTree = () => {
    let importedSeries = this.state.seriesObjects;
    let importedTree = {};

    function addNewPatient(patientID, patientDetails) {
      if (!Object.keys(importedTree).includes(patientID)) {
        importedTree[patientID] = {
          PatientOrthancID: patientID,
          ...patientDetails,
          studies: {},
        };
      }
    }

    function addNewStudy(studyID, studyDetails) {
      if (
        !Object.keys(
          importedTree[studyDetails.ParentPatient]["studies"]
        ).includes(studyID)
      ) {
        importedTree[studyDetails.ParentPatient]["studies"][studyID] = {
          ...studyDetails["MainDicomTags"],
          series: {},
        };
      }
    }

    for (let seriesID of Object.keys(importedSeries)) {
      let series = this.state.seriesObjects[seriesID];
      let studyDetails = this.state.studiesObjects[series.ParentStudy];
      let patientDetails =
        this.state.patientsObjects[studyDetails.ParentPatient];
      addNewPatient(studyDetails.ParentPatient, patientDetails);
      addNewStudy(series.ParentStudy, studyDetails);
      importedTree[studyDetails.ParentPatient]["studies"][series.ParentStudy][
        "series"
      ][series.ID] = {
        ...series["MainDicomTags"],
        Instances: series["Instances"],
      };
    }

    let resultArray = treeToPatientArray(importedTree);

    return resultArray;
  };

  /**
   * check if study is already known
   * @param {string} studyID
   */
  isKnownStudy = (studyID) => {
    return Object.keys(this.state.studiesObjects).includes(studyID);
  };

  isKnownSeries = (seriesID) => {
    return Object.keys(this.state.seriesObjects).includes(seriesID);
  };

  sendImportedToExport = () => {
    this.props.addStudiesToExportList(
      treeToStudyArray(this.state.studiesObjects)
    );
  };

  sendImportedToAnon = () => {
    this.props.addStudiesToAnonList(
      treeToStudyArray(this.state.studiesObjects)
    );
  };

  sendImportedToDelete = () => {
    this.props.addStudiesToDeleteList(
      treeToStudyArray(this.state.studiesObjects)
    );
  };

  /**
   * Trigger the display of the error table
   */
  handleShowErrorClick = () => {
    this.setState({
      showErrors: !this.state.showErrors,
    });
  };

  dragListener = (dragStarted) => {
    this.setState({ isDragging: dragStarted });
  };

  render = () => {
    const percentage = 66;
    return (
      <div>
        <Row className="mt-5">
          <Col>
            <Dropzone
              onDragEnter={() => this.dragListener(true)}
              onDragLeave={() => this.dragListener(false)}
              disabled={this.state.inProgress}
              onDrop={(acceptedFiles) => this.addFile(acceptedFiles)}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div
                    className={
                      this.state.isDragging || this.state.inProgress
                        ? "dropzone dz-parsing"
                        : "dropzone"
                    }
                    {...getRootProps()}
                  >
                    <div
                      class="responsive"
                      style={{
                        width: "114px",
                        position: "relative",
                        left: "41%",
                      }}
                    >
                      <img
                        src={Images}
                        width="300px"
                        height="300px"
                        text-align="center"
                      ></img>
                      <div
                        style={{
                          position: "absolute",
                          top: "31%",
                          left: "76%",
                          width: 130,
                        }}
                      >
                        <div>
                          <CircularProgressbarWithChildren
                            value={(
                              100 *
                                (this.state.processedFiles /
                                  this.state.numberOfFiles) || 0
                            ).toFixed(2)}
                            text={`${(
                              100 *
                                (this.state.processedFiles /
                                  this.state.numberOfFiles) || 0
                            ).toFixed(2)}%`}
                            strokeWidth={10}
                            styles={buildStyles({
                              strokeLinecap: "butt",
                            })}
                          >
                            <RadialSeparators
                              count={12}
                              style={{
                                background: "#fff",
                                width: "2px",
                                height: `${10}%`,
                              }}
                            />
                          </CircularProgressbarWithChildren>
                        </div>
                      </div>
                    </div>
                    <input
                      directory=""
                      webkitdirectory=""
                      {...getInputProps()}
                    />
                    <p>
                      {this.state.inProgress
                        ? "Uploading"
                        : "Drag & Drop DICOM files here"}
                    </p>
                  </div>
                </section>
              )}
            </Dropzone>
            <h3
              style={{
                textAlign: "center",
                fontSize: "x-large",
                marginTop: "35px",
              }}
            >
              Please do not close the browser while
              <br />
              uploading files!
            </h3>
          </Col>
        </Row>
        <Row className="mt-5">
          <Col>
            <input
              type="button"
              className="otjs-button otjs-button-red w-10"
              value={"See Errors (" + this.state.errors.length + ")"}
              onClick={this.handleShowErrorClick}
            />
          </Col>
        </Row>

        <Modal
          show={this.state.showErrors}
          onHide={this.handleShowErrorClick}
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>Errors</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TableImportError data={this.state.errors} />
          </Modal.Body>
        </Modal>
        <Row className="mt-5">
          <Col>
            <TablePatientsWithNestedStudiesAndSeries
              patients={this.buildImportTree()}
              hiddenActionBouton={false}
            />
          </Col>
        </Row>

        <AnonExportDeleteSendButton
          onAnonClick={this.sendImportedToAnon}
          onExportClick={this.sendImportedToExport}
          onDeleteClick={this.sendImportedToDelete}
        />

        <Prompt
          when={this.state.inProgress}
          message="Import in progress. Quit this page will stop the import"
        />
      </div>
    );
  };
}

const mapDispatchToProps = {
  addStudiesToExportList,
  addStudiesToDeleteList,
  addStudiesToAnonList,
};

const mapStateToProps=(state)=>({
  roles:state.PadiMedical.roles
})
export default connect(mapStateToProps, mapDispatchToProps)(Import);
