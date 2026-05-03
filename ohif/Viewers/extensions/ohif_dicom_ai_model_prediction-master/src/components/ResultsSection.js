import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
import DiagnosisReportModal from './DiagnosisReportModal';
import OHIF from '@ohif/core';

class ResultsSection extends Component {
  handleGenerateReport = event => {
    const { UIModalService } = this.props.servicesManager.services;
    const { UINotificationService } = this.props.servicesManager.services;
    const textareaReport = document.getElementById('report-text');

    const activeEnabledElement = cornerstone.getEnabledElements()[0];
    const studyData = cornerstone.metaData.get(
      'generalStudyModule',
      activeEnabledElement.image.imageId
    );
    const seriesData = cornerstone.metaData.get(
      'generalSeriesModule',
      activeEnabledElement.image.imageId
    );
    const patientData = cornerstone.metaData.get(
      'patientModule',
      activeEnabledElement.image.imageId
    );

    const WrappedDebugReportModal = function () {
      return (
        <DiagnosisReportModal
          mailTo={stateDetails.options.mailTo}
          reportText={textareaReport.value}
          prediction={stateDetails.predictionResults}
          series={seriesData}
          study={studyData}
          patient={patientData}
          notificationService={UINotificationService}
        />
      );
    };

    UIModalService.show({
      content: WrappedDebugReportModal,
      title: `Report Information`,
    });
  };

  getPredictionLabel = data => {
    let temp = [];
    if(!data)return;
    data.map(obj => {
      if (!temp.includes(obj[0].description)) temp.push(obj[0].description);
    });
    return temp.map(text => <li>{text}</li>);
  };

  getMaxPrediction = data => {
    let temp = [];
    if(!data)return;
    data.map(obj => {
      if (!temp.includes(obj[1].description)) temp.push(obj[1].description);
    });
    if(typeof temp[0] == "string")return temp[0];
    return Math.max(...temp);
  };

  render() {
    console.log("result preduction",stateDetails.predictionResults)
    const resultsItems = stateDetails.predictionResults[0].map(
      ({ title, description }, index) => (
        <div className="result-individual-section">
          <p className="text-bold">{title}</p>
          <p>
            {index == 0 && (
              <ul>{this.getPredictionLabel(stateDetails.predictionResults)}</ul>
            )}
            {index == 1 &&
              this.getMaxPrediction(stateDetails.predictionResults)}
            {index == 2 && description}
          </p>
        </div>
      )
    );

    const noResultsAvailable = (
      <div className="no-results-available">
        <h3>No Results Available</h3>
      </div>
    );

    return (
      <div id="results-section-wrapper">
        <div className="form-group">
          <label className="form-label" htmlFor="ai-models">
            Results
          </label>
        </div>
        {resultsItems && resultsItems.length
          ? resultsItems
          : noResultsAvailable}

        {resultsItems && resultsItems.length ? (
          <div className="report-section">
            <textarea className="report" id="report-text" value={`Disclaimer\n
        This result is not a final diagnosis or findings for the scan. Please correlate with the professional and clinical findings.
`}></textarea>
            <button className="btn btn-sm" onClick={this.handleGenerateReport}>
              Generate Report
            </button>
          </div>
        ) : null}
      </div>
    );
  }
}

export default ResultsSection;
