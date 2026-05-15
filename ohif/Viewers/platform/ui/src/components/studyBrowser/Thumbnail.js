import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import { useDrag } from 'react-dnd';
import { classes } from '@ohif/core';
import ImageThumbnail from './ImageThumbnail';
import classNames from 'classnames';
import { Icon } from './../../elements/Icon';
import { Tooltip } from './../tooltip';
import { OverlayTrigger } from './../overlayTrigger';
import './Thumbnail.styl';

const StudyLoadingListener = classes.StudyLoadingListener;

function ThumbnailFooter({
  SeriesDescription,
  SeriesNumber,
  numImageFrames,
  hasWarnings,
  hasDerivedDisplaySets,
}) {
  const [inconsistencyWarnings, inconsistencyWarningsSet] = useState([]);
  const [derivedDisplaySetsActive, derivedDisplaySetsActiveSet] = useState([]);

  useEffect(() => {
    let unmounted = false;
    hasWarnings.then(response => {
      if (!unmounted) inconsistencyWarningsSet(response);
    });
    hasDerivedDisplaySets.then(response => {
      if (!unmounted) derivedDisplaySetsActiveSet(response);
    });
    return () => { unmounted = true; };
  }, [hasWarnings, hasDerivedDisplaySets]);

  const infoOnly = !SeriesDescription;

  const getInfo = (value, icon, className = '') => (
    <div className={classNames('item item-series', className)}>
      <div className="icon">{icon}</div>
      <div className="value">{value}</div>
    </div>
  );

  const getWarningContent = inconsistencyWarnings => {
    if (Array.isArray(inconsistencyWarnings)) {
      return <ol>{inconsistencyWarnings.map((warn, i) => <li key={i}>{warn}</li>)}</ol>;
    }
    return <React.Fragment>{inconsistencyWarnings}</React.Fragment>;
  };

  const getWarningInfo = (SeriesNumber, inconsistencyWarnings) => (
    <React.Fragment>
      {inconsistencyWarnings && inconsistencyWarnings.length !== 0 ? (
        <OverlayTrigger
          key={SeriesNumber}
          placement="left"
          overlay={
            <Tooltip placement="left" className="in tooltip-warning" id="tooltip-left">
              <div className="warningTitle">Series Inconsistencies</div>
              <div className="warningContent">{getWarningContent(inconsistencyWarnings)}</div>
            </Tooltip>
          }
        >
          <div className="warning">
            <span className="warning-icon"><Icon name="exclamation-triangle" /></span>
          </div>
        </OverlayTrigger>
      ) : null}
    </React.Fragment>
  );

  const getDerivedInfo = derivedDisplaySetsActive => (
    <React.Fragment>
      {derivedDisplaySetsActive ? (
        <div className="derived"><Icon name="link" /></div>
      ) : null}
    </React.Fragment>
  );

  const getSeriesInformation = (SeriesNumber, numImageFrames, inconsistencyWarnings, derivedDisplaySetsActive) => {
    if (!SeriesNumber && !numImageFrames) return null;
    return (
      <div className="series-information">
        {SeriesNumber !== undefined ? getInfo(SeriesNumber, 'S:') : null}
        {numImageFrames !== undefined ? getInfo(numImageFrames, '', 'image-frames') : null}
        {getDerivedInfo(derivedDisplaySetsActive)}
        {getWarningInfo(SeriesNumber, inconsistencyWarnings)}
      </div>
    );
  };

  return (
    <div className={classNames('series-details', { 'info-only': infoOnly })}>
      <div className="series-description">{SeriesDescription}</div>
      {getSeriesInformation(SeriesNumber, numImageFrames, inconsistencyWarnings, derivedDisplaySetsActive)}
    </div>
  );
}

function Thumbnail(props) {
  const {
    active,
    altImageText,
    error,
    displaySetInstanceUID,
    imageId,
    imageSrc,
    seriesInstanceUid,
    StudyInstanceUID,
    onClick,
    onDoubleClick,
    onMouseDown,
    supportsDrag,
    showProgressBar,
    onZip,
  } = props;

  const [stackPercentComplete, setStackPercentComplete] = useState(0);
  const [zipProgress, setZipProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    const onProgressChange = throttle(({ detail }) => {
      const { progressId, progressData } = detail;
      if (`StackProgress:${displaySetInstanceUID}` === progressId) {
        const percent = progressData ? progressData.percentComplete : 0;
        if (percent > stackPercentComplete) {
          setStackPercentComplete(percent);
        }
      }
    }, 100);

    document.addEventListener(StudyLoadingListener.events.OnProgress, onProgressChange);
    return () => document.removeEventListener(StudyLoadingListener.events.OnProgress, onProgressChange);
  }, [displaySetInstanceUID, stackPercentComplete]);

  const [collectedProps, drag, dragPreview] = useDrag({
    item: { StudyInstanceUID, displaySetInstanceUID, type: 'thumbnail' },
    canDrag: function(monitor) { return supportsDrag; },
  });

  const hasImage = imageSrc || imageId;
  const hasAltText = altImageText !== undefined;

  // ── ZIP handler ──
  const handleZip = (e) => {
    e.stopPropagation();
    if (isZipping || !onZip) return;
    setIsZipping(true);
    setZipProgress(0);
    onZip({ displaySetInstanceUID, seriesInstanceUid, StudyInstanceUID, onProgress: setZipProgress })
      .then(() => setIsZipping(false))
      .catch(() => setIsZipping(false));
  };

  return (
    <div
      ref={drag}
      className={classNames('thumbnail', { active: active })}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      {/* ── IMAGE ── */}
      {hasImage && (
        <ImageThumbnail
          active={active}
          imageSrc={imageSrc}
          imageId={imageId}
          seriesInstanceUid={seriesInstanceUid}
          error={error}
          stackPercentComplete={stackPercentComplete}
          showProgressBar={showProgressBar}
          zipProgress={zipProgress}
          isZipping={isZipping}
          planeIndicator={props.planeIndicator}
        />
      )}
      {/* ── ALT TEXT ── */}
      {!hasImage && hasAltText && (
        <div className="alt-image-text p-x-1">
          <h1>{altImageText}</h1>
        </div>
      )}
      {ThumbnailFooter(props)}
    </div>
  );
}

const noop = () => {};

Thumbnail.propTypes = {
  supportsDrag: PropTypes.bool,
  id: PropTypes.string.isRequired,
  displaySetInstanceUID: PropTypes.string.isRequired,
  StudyInstanceUID: PropTypes.string.isRequired,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  seriesInstanceUid: PropTypes.string,
  error: PropTypes.bool,
  active: PropTypes.bool,
  stackPercentComplete: PropTypes.number,
  altImageText: PropTypes.string,
  SeriesDescription: PropTypes.string,
  SeriesNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hasWarnings: PropTypes.instanceOf(Promise),
  hasDerivedDisplaySets: PropTypes.instanceOf(Promise),
  numImageFrames: PropTypes.number,
  onDoubleClick: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  showProgressBar: PropTypes.bool,
  onZip: PropTypes.func,
  planeIndicator: PropTypes.string,
};

Thumbnail.defaultProps = {
  supportsDrag: false,
  active: false,
  error: false,
  stackPercentComplete: 0,
  onDoubleClick: noop,
  onClick: noop,
  onMouseDown: noop,
};

export { Thumbnail };
