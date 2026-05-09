import { PureComponent } from 'react';
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import './OHIFCornerstoneViewportOverlay.css';
import {
  isValidNumber,
  formatNumberPrecision,
  formatDICOMDate,
  formatDICOMTime,
  formatPN,
  getCompression,
} from '../utils/formatStudy';
import classNames from 'classnames';
import { Icon } from '@ohif/ui/src/elements/Icon';
import { Tooltip } from '@ohif/ui/src/components/tooltip';
import { OverlayTrigger } from '@ohif/ui/src/components/overlayTrigger';

const Button = styled.button`
  color: white;
  padding: 2px 7px;
  border-radius: 10px;
  outline: 0;
  text-transform: none;
  margin: 2px 2px;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.9;
  }
`;

class OHIFCornerstoneViewportOverlay extends PureComponent {
  static propTypes = {
    scale: PropTypes.number.isRequired,
    windowWidth: PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
    windowCenter: PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
    imageId: PropTypes.string.isRequired,
    imageIndex: PropTypes.number.isRequired,
    stackSize: PropTypes.number.isRequired,
    inconsistencyWarnings: PropTypes.array,
    SRLabels: PropTypes.array,
  };

  render() {
    const {
      imageId,
      scale,
      windowWidth,
      windowCenter,
      inconsistencyWarnings,
      SRLabels,
    } = this.props;

    if (!imageId) {
      return null;
    }

    const zoomPercentage = formatNumberPrecision(scale * 100, 0);
    const seriesMetadata =
      cornerstone.metaData.get('generalSeriesModule', imageId) || {};
    const imagePlaneModule =
      cornerstone.metaData.get('imagePlaneModule', imageId) || {};
    const { rows, columns, sliceThickness, sliceLocation } = imagePlaneModule;
    const { seriesNumber, seriesDescription } = seriesMetadata;

    const generalStudyModule =
      cornerstone.metaData.get('generalStudyModule', imageId) || {};
    const { studyDate, studyTime, studyDescription } = generalStudyModule;

    const patientModule =
      cornerstone.metaData.get('patientModule', imageId) || {};
    const { patientId, patientName } = patientModule;

    const generalImageModule =
      cornerstone.metaData.get('generalImageModule', imageId) || {};
    const { instanceNumber } = generalImageModule;

    const cineModule = cornerstone.metaData.get('cineModule', imageId) || {};
    const { frameTime } = cineModule;

    const frameRate = formatNumberPrecision(1000 / frameTime, 1);
    const compression = getCompression(imageId);
    const wwwc = `W: ${
      windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
    } L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`;
    const imageDimensions = `${columns} x ${rows}`;

    const { imageIndex, stackSize } = this.props;

    const inconsistencyWarningsOn =
      inconsistencyWarnings && inconsistencyWarnings.length !== 0
        ? true
        : false;
    const getWarningContent = warningList => {
      if (Array.isArray(warningList)) {
        const listedWarnings = warningList.map((warn, index) => {
          return <li key={index}>{warn}</li>;
        });

        return <ol>{listedWarnings}</ol>;
      } else {
        return <React.Fragment>{warningList}</React.Fragment>;
      }
    };

    const getWarningInfo = (seriesNumber, inconsistencyWarnings) => {
      return (
        <React.Fragment>
          {inconsistencyWarnings.length != 0 ? (
            <OverlayTrigger
              key={seriesNumber}
              placement="left"
              overlay={
                <Tooltip
                  placement="left"
                  className="in tooltip-warning"
                  id="tooltip-left"
                >
                  <div className="warningTitle">Series Inconsistencies</div>
                  <div className="warningContent">
                    {getWarningContent(inconsistencyWarnings)}
                  </div>
                </Tooltip>
              }
            >
              <div className={classNames('warning')}>
                <span className="warning-icon">
                  <Icon name="exclamation-triangle" />
                </span>
              </div>
            </OverlayTrigger>
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </React.Fragment>
      );
    };

    const SRLabelsOn = SRLabels && SRLabels.length !== 0 ? true : false;

    /**/

    const getSRLabelsContent = SRLabels => {
      if (Array.isArray(SRLabels)) {
        const listedSRLabels = SRLabels.map((SRLabel, index) => {
          const color = SRLabel.labels.color;
          return (
            SRLabel.labels.visible && (
              <OverlayTrigger
                key={index}
                placement="top"
                overlay={
                  <Tooltip
                    placement="top"
                    className="in tooltip-warning"
                    id="tooltip-top"
                  >
                    <div className="warningTitle">
                      {' '}
                      Coding scheme designators{' '}
                    </div>
                    <div className="warningContent">
                      {SRLabel.labels.labelCodingSchemeDesignator +
                        ' : ' +
                        SRLabel.labels.valueCodingSchemeDesignator}
                    </div>
                  </Tooltip>
                }
              >
                <div style={{ display: 'inline-block' }}>
                  <Button
                    style={{
                      backgroundColor: color,
                    }}
                    disabled={true}
                    key={index}
                  >
                    {SRLabel.labels.label + ' : ' + SRLabel.labels.value}
                  </Button>
                </div>
              </OverlayTrigger>
            )
          );
        });

        return <ol>{listedSRLabels}</ol>;
      } else {
        return <React.Fragment></React.Fragment>;
      }
    };

    const getSRLabelsInfo = SRLabels => {
      return (
        <React.Fragment>
          {SRLabels.length != 0 ? (
            getSRLabelsContent(SRLabels)
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </React.Fragment>
      );
    };

    // ── Orientation indicator: detect image plane from direction cosines ──
    const getPlaneOrientation = () => {
      const { rowCosines, columnCosines } = imagePlaneModule;
      if (!rowCosines || !columnCosines) return null;
      // Compute normal vector = row × column (cross product)
      const nx = rowCosines[1] * columnCosines[2] - rowCosines[2] * columnCosines[1];
      const ny = rowCosines[2] * columnCosines[0] - rowCosines[0] * columnCosines[2];
      const nz = rowCosines[0] * columnCosines[1] - rowCosines[1] * columnCosines[0];
      const absNx = Math.abs(nx);
      const absNy = Math.abs(ny);
      const absNz = Math.abs(nz);
      // Axial: normal ≈ Z axis, minus Z axis, or close to Z
      if (absNz >= absNx && absNz >= absNy) return { label: 'A', color: '#ef4444' };
      // Sagittal: normal ≈ X axis
      if (absNx >= absNy && absNx >= absNz) return { label: 'S', color: '#22c55e' };
      // Coronal: normal ≈ Y axis
      return { label: 'C', color: '#eab308' };
    };
    const orientation = getPlaneOrientation();
    const orientationDot = orientation ? (
      <div
        className="orientation-indicator"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: orientation.color,
          boxShadow: `0 0 6px ${orientation.color}80`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
        title={`${orientation.label} plane`}
      />
    ) : null;

    const normal = (
      <React.Fragment>
        {orientationDot}
        <div className="top-left overlay-element">
          <div>{formatPN(patientName)}</div>
          <div>{patientId}</div>
        </div>
        <div className="top-right overlay-element">
          <div>{studyDescription}</div>
          <div>
            {formatDICOMDate(studyDate)} {formatDICOMTime(studyTime)}
          </div>
        </div>
        <div className="bottom-right overlay-element">
          <div>Zoom: {zoomPercentage}%</div>
          <div>{wwwc}</div>
          <div className="compressionIndicator">{compression}</div>
        </div>
        <div className="bottom-left2 warning">
          <div>
            {inconsistencyWarningsOn
              ? getWarningInfo(seriesNumber, inconsistencyWarnings)
              : ''}
          </div>
        </div>
        <div className="bottom-left3 warning">
          <div>{SRLabelsOn ? getSRLabelsInfo(SRLabels) : ''}</div>
        </div>
        <div className="bottom-left overlay-element">
          <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
          <div>
            {stackSize > 1
              ? `Img: ${instanceNumber} ${imageIndex}/${stackSize}`
              : ''}
          </div>
          <div>
            {frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}
            <div>{imageDimensions}</div>
            <div>
              {isValidNumber(sliceLocation)
                ? `Loc: ${formatNumberPrecision(sliceLocation, 2)} mm `
                : ''}
              {sliceThickness
                ? `Thick: ${formatNumberPrecision(sliceThickness, 2)} mm`
                : ''}
            </div>
            <div>{seriesDescription}</div>
          </div>
        </div>
      </React.Fragment>
    );

    return <div className="OHIFCornerstoneViewportOverlay">{normal}</div>;
  }
}

export default OHIFCornerstoneViewportOverlay;
