import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import { shouldFilterSeries } from './SeriesFilterService';
import { Icon } from './../../elements/Icon';
import classNames from 'classnames';
import './StudyBrowser.styl';

function StudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
    showThumbnailProgressBar,
    onShowMore,
    hasMoreSeries,
    stabilityMode,
  } = props;

  // ── Per-series loading/ZIP state ──
  const [loadingStates, setLoadingStates] = useState({});
  const [zipStates, setZipStates] = useState({});

  const handleLoad = useCallback((displaySetInstanceUID, e) => {
    if (e) e.stopPropagation();
    setLoadingStates(prev => ({ ...prev, [displaySetInstanceUID]: true }));
    onThumbnailClick(displaySetInstanceUID);
  }, [onThumbnailClick]);

  const handleOpenInTab = useCallback((studyInstanceUID, seriesInstanceUID, e) => {
    if (e) e.stopPropagation();

    if (!studyInstanceUID || !seriesInstanceUID) {
      console.warn('[OPEN TAB] Missing UID', { studyInstanceUID, seriesInstanceUID });
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('StudyInstanceUID', studyInstanceUID);
    url.searchParams.set('SeriesInstanceUID', seriesInstanceUID);
    url.searchParams.set('singleSeries', 'true');

    // Store the full OHIF viewer URL in localStorage, then open the
    // masked /external-page route (same as AI Viewer button). The
    // /external-page component renders a fullscreen iframe with the
    // stored URL, keeping the browser address bar clean.
    localStorage.setItem('temp-link', url.toString());
    window.open('/external-page', '_blank');
  }, []);

  const handleZip = useCallback((studyInstanceUID, seriesInstanceUID, e) => {
    if (e) e.stopPropagation();

    // Prevent duplicate click while downloading
    if (zipStates[seriesInstanceUID] && zipStates[seriesInstanceUID].status === 'downloading') {
      return;
    }

    setZipStates(prev => ({
      ...prev,
      [seriesInstanceUID]: { status: 'downloading', percent: 0, error: null },
    }));

    const url = `/api/dicom/studies/${encodeURIComponent(studyInstanceUID)}/series/${encodeURIComponent(seriesInstanceUID)}/download-zip`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    // ── Progress tracking ──
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setZipStates(prev => ({
          ...prev,
          [seriesInstanceUID]: { ...prev[seriesInstanceUID], percent },
        }));
      } else {
        // Still increment to show activity
        setZipStates(prev => ({
          ...prev,
          [seriesInstanceUID]: {
            ...prev[seriesInstanceUID],
            percent: Math.min(((prev[seriesInstanceUID] && prev[seriesInstanceUID].percent) || 0) + 1, 99),
          },
        }));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        const contentDisposition = xhr.getResponseHeader('Content-Disposition');
        let filename = `series_${seriesInstanceUID}.zip`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/i);
          if (match) filename = match[1];
        }

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        setZipStates(prev => ({
          ...prev,
          [seriesInstanceUID]: { status: 'done', percent: 100, error: null },
        }));
      } else {
        setZipStates(prev => ({
          ...prev,
          [seriesInstanceUID]: {
            status: 'error',
            percent: 0,
            error: `Download failed (${xhr.status})`,
          },
        }));
      }
    };

    xhr.onerror = () => {
      setZipStates(prev => ({
        ...prev,
        [seriesInstanceUID]: {
          status: 'error',
          percent: 0,
          error: 'Network error',
        },
      }));
    };

    xhr.send();
  }, [zipStates]);

  return (
    <div className="study-browser">
      <div className="scrollable-study-thumbnails">
        {studies
          .map((study, studyIndex) => {
            const { StudyInstanceUID } = study;
            return study.thumbnails
              .filter(thumb => !shouldFilterSeries(thumb.SeriesDescription))
              .map((thumb, thumbIndex) => {
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

              // Show buttons for real image series (not SR, SEG, PR, RawData)
              const showActions = Modality && Modality !== 'SR' && Modality !== 'SEG' && Modality !== 'PR';
              const isLoading = loadingStates[displaySetInstanceUID];
              const zipState = zipStates[SeriesInstanceUID];
              const isZipLoading = zipState && zipState.status === 'downloading';
              const isZipDone = zipState && zipState.status === 'done';
              const isZipError = zipState && zipState.status === 'error';
              const zipPercent = (zipState && zipState.percent) || 0;
              const zipError = (zipState && zipState.error) || '';

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
                    seriesInstanceUid={SeriesInstanceUID}
                    SeriesDescription={SeriesDescription}
                    SeriesNumber={SeriesNumber}
                    Modality={Modality}
                    hasWarnings={hasWarnings}
                    hasDerivedDisplaySets={hasDerivedDisplaySets}
                    onClick={() => onThumbnailClick(displaySetInstanceUID)}
                    onDoubleClick={onThumbnailDoubleClick}
                    showProgressBar={showThumbnailProgressBar}
                  />
                  {showActions && (
                    <div className="series-actions">
                      {/* ── Row 1: Load + ZIP ── */}
                      <div className="series-actions-row">
                        {/* ── Load button ── */}
                        <div
                          className={classNames('action-btn', 'action-load', {
                            loading: isLoading,
                            loaded: active,
                          })}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleLoad(displaySetInstanceUID, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLoad(displaySetInstanceUID); } }}
                          title={active ? 'Series loaded' : 'Load series'}
                          style={{ touchAction: 'pan-y' }}
                        >
                          <Icon name="th-large" />
                          <span>{active ? 'Loaded' : isLoading ? 'Loading' : 'Load'}</span>
                        </div>
                        {/* ── ZIP button ── */}
                        <div
                          className={classNames('action-btn', 'action-zip', {
                            loading: isZipLoading,
                            done: isZipDone,
                            error: isZipError,
                          })}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleZip(StudyInstanceUID, SeriesInstanceUID, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZip(StudyInstanceUID, SeriesInstanceUID, e); } }}
                          title={isZipError ? `${zipError} — tap to retry` : 'Download series ZIP'}
                          style={{ touchAction: 'pan-y' }}
                        >
                          <Icon name="save" />
                          <span>
                            {isZipLoading
                              ? `${zipPercent}%`
                              : isZipDone
                                ? 'Done'
                                : isZipError
                                  ? 'Retry'
                                  : 'ZIP'}
                          </span>
                        </div>
                      </div>
                      {/* ── Row 2: Open in New Tab ── */}
                      <div className="series-actions-row series-actions-row--tab">
                        <div
                          className="action-btn action-open"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleOpenInTab(StudyInstanceUID, SeriesInstanceUID, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenInTab(StudyInstanceUID, SeriesInstanceUID); } }}
                          title="Open this series in a new tab"
                          style={{ touchAction: 'pan-y' }}
                        >
                          <Icon name="link" />
                          <span>Open in New Tab</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ── ZIP progress bar ── */}
                  {showActions && isZipLoading && (
                    <div className="zip-progress-bar">
                      <div
                        className="zip-progress-fill"
                        style={{ width: `${zipPercent}%` }}
                      />
                    </div>
                  )}
                  {showActions && isZipError && (
                    <div className="zip-error-text">{zipError}</div>
                  )}
                  {/* ── Large series tab recommendation ── */}
                  {showActions && numImageFrames > 1000 && !isZipDone && (
                    <div className="tab-recommendation-text">
                      Large series — tab recommended
                    </div>
                  )}
                </div>
              );
            });
          })
          .flat()}

        {/* ── Show More Series button (recovery / large study) ── */}
        {hasMoreSeries && onShowMore && (
          <div className="show-more-series-wrapper">
            <button
              className="show-more-series-btn"
              onClick={onShowMore}
              type="button"
            >
              Show more series
            </button>
          </div>
        )}
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
  onShowMore: PropTypes.func,
  hasMoreSeries: PropTypes.bool,
  stabilityMode: PropTypes.bool,
};

StudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
  showThumbnailProgressBar: true,
};

export { StudyBrowser };
