import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import './StudyBrowser.styl';

/**
 * Download a single DICOM series as a ZIP archive.
 * Two-step: find Orthanc UUID via /api/tools/find, then download the archive.
 */
function downloadSeries(StudyInstanceUID, SeriesInstanceUID, SeriesDescription) {
  const filename = (SeriesDescription || SeriesInstanceUID || 'series').replace(/[^a-zA-Z0-9_-]/g, '_') + '.zip';

  // Step 1: find Orthanc UUID for this series
  const findUrl = '/api/tools/find';
  const findBody = JSON.stringify({
    Level: 'Series',
    Query: {
      StudyInstanceUID,
      SeriesInstanceUID,
    },
  });

  const xhr = new XMLHttpRequest();
  xhr.open('POST', findUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.responseType = 'json';

  xhr.onload = function () {
    if (xhr.status === 200 && xhr.response && xhr.response.length > 0) {
      const orthancUuid = xhr.response[0];
      startArchiveDownload(orthancUuid, filename);
    } else if (xhr.status === 401) {
      alert('Authentication required. Please log in first.');
    } else {
      alert('Series not found for download.');
    }
  };

  xhr.onerror = function () {
    alert('Failed to connect to server.');
  };

  xhr.send(findBody);
}

/**
 * Stream download of Orthanc series archive with progress tracking.
 * Uses a temporary anchor with progress displayed in a simple overlay.
 */
function startArchiveDownload(orthancUuid, filename) {
  // Create progress overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:24px 32px;border-radius:12px;z-index:99999;text-align:center;font-family:sans-serif;min-width:280px;';
  overlay.innerHTML = `
    <div style="font-size:16px;margin-bottom:12px;">Downloading series...</div>
    <div style="background:rgba(255,255,255,0.15);height:8px;border-radius:4px;overflow:hidden;">
      <div id="download-progress-bar" style="background:#20a5d6;height:100%;width:0%;transition:width 0.3s;"></div>
    </div>
    <div id="download-progress-text" style="margin-top:8px;font-size:13px;color:#aaa;">0%</div>
  `;
  document.body.appendChild(overlay);

  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/series/' + orthancUuid + '/archive', true);
  xhr.responseType = 'blob';

  let startTime = Date.now();

  xhr.onprogress = function (e) {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      const bar = document.getElementById('download-progress-bar');
      const text = document.getElementById('download-progress-text');
      if (bar) bar.style.width = pct + '%';
      if (text) {
        const loaded = (e.loaded / 1024 / 1024).toFixed(1);
        const total = (e.total / 1024 / 1024).toFixed(1);
        text.textContent = pct + '% (' + loaded + ' / ' + total + ' MB)';
      }
    } else {
      const elapsed = (Date.now() - startTime) / 1000;
      const loaded = (e.loaded / 1024 / 1024).toFixed(1);
      const text = document.getElementById('download-progress-text');
      if (text) text.textContent = loaded + ' MB downloaded (' + elapsed.toFixed(0) + 's)';
    }
  };

  xhr.onload = function () {
    document.body.removeChild(overlay);
    if (xhr.status === 200) {
      const blob = xhr.response;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (xhr.status === 401) {
      alert('Authentication required. Please log in first.');
    } else {
      alert('Download failed (status ' + xhr.status + ').');
    }
  };

  xhr.onerror = function () {
    if (overlay.parentNode) document.body.removeChild(overlay);
    alert('Download failed. Network error.');
  };

  xhr.send();
}

function StudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
    showThumbnailProgressBar,
  } = props;

  const [downloadingSet, setDownloadingSet] = useState(null);

  const handleDownload = (StudyInstanceUID, SeriesInstanceUID, SeriesDescription, displaySetInstanceUID) => {
    setDownloadingSet(displaySetInstanceUID);
    downloadSeries(StudyInstanceUID, SeriesInstanceUID, SeriesDescription);
    // Reset after download completes (simple approach)
    setTimeout(() => setDownloadingSet(null), 5000);
  };

  return (
    <div className="study-browser">
      <div className="scrollable-study-thumbnails">
        {studies
          .map((study, studyIndex) => {
            const { StudyInstanceUID } = study;
            return study.thumbnails.map((thumb, thumbIndex) => {
              const {
                active,
                altImageText,
                displaySetInstanceUID,
                imageId,
                derivedDisplaySetsNumber,
                numImageFrames,
                SeriesDescription,
                SeriesNumber,
                SeriesInstanceUID,
                Modality,
                hasWarnings,
                hasDerivedDisplaySets,
              } = thumb;

              // Show download button only for real image series (not SR, SEG, etc.)
              const showDownload = imageId && Modality !== 'SR' && Modality !== 'SEG' && Modality !== 'PR';

              return (
                <div
                  key={thumb.displaySetInstanceUID}
                  className="thumbnail-container"
                  data-cy="thumbnail-list"
                >
                  <Thumbnail
                    active={active}
                    supportsDrag={supportsDrag}
                    key={`${studyIndex}_${thumbIndex}`}
                    id={`${studyIndex}_${thumbIndex}`}
                    StudyInstanceUID={StudyInstanceUID}
                    altImageText={altImageText}
                    imageId={imageId}
                    derivedDisplaySetsNumber={derivedDisplaySetsNumber}
                    displaySetInstanceUID={displaySetInstanceUID}
                    numImageFrames={numImageFrames}
                    SeriesDescription={SeriesDescription}
                    SeriesNumber={SeriesNumber}
                    Modality={Modality}
                    hasWarnings={hasWarnings}
                    hasDerivedDisplaySets={hasDerivedDisplaySets}
                    onClick={onThumbnailClick.bind(
                      undefined,
                      displaySetInstanceUID
                    )}
                    onDoubleClick={onThumbnailDoubleClick}
                    showProgressBar={showThumbnailProgressBar}
                  />
                  {showDownload && (
                    <button
                      className="series-download-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(StudyInstanceUID, SeriesInstanceUID, SeriesDescription, displaySetInstanceUID);
                      }}
                      title="Download this series as DICOM ZIP"
                    >
                      ⬇ Download
                    </button>
                  )}
                </div>
              );
            });
          })
          .flat()}
      </div>
    </div>
  );
}

const noop = () => {};

StudyBrowser.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      StudyInstanceUID: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUID: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          SeriesInstanceUID: PropTypes.string,
          derivedDisplaySetsNumber: PropTypes.number,
          numImageFrames: PropTypes.number,
          SeriesDescription: PropTypes.string,
          SeriesNumber: PropTypes.number,
          Modality: PropTypes.string,
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
  showThumbnailProgressBar: PropTypes.bool,
};

StudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
  showThumbnailProgressBar: true,
};

export { StudyBrowser };
