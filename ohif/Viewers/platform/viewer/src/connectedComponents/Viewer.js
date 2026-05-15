import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OHIF, { MODULE_TYPES, DICOMSR } from '@ohif/core';
import { withDialog } from '@ohif/ui';
import moment from 'moment';

import ConnectedHeader from './ConnectedHeader.js';
import ToolbarRow from './ToolbarRow.js';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import SidePanel from './../components/SidePanel.js';
import ErrorBoundaryDialog from './../components/ErrorBoundaryDialog';
import ViewerErrorBoundary from './../components/ViewerErrorBoundary/ViewerErrorBoundary.js';
import { extensionManager, servicesManager } from './../App.js';
import { ReconstructionIssues } from './../../../core/src/enums.js';

/** Stability Mode */
import {
  saveSession,
  getLastSession,
  isRecoveryMode,
  isLargeStudyDetected,
  isMobileLargeStudyDetected,
  checkStabilityMode,
  initStabilityMode,
  getStabilityBannerText,
  setStabilityOverride,
  clearStabilityOverride,
  getStabilityOverride,
  hideStabilityBanner,
  isStabilityBannerHidden,
  hideLargeStudyBanner,
  isLargeStudyBannerHidden,
  LARGE_STUDY_SERIES_THRESHOLD,
  SERIES_INCREMENT,
  INITIAL_THUMBNAILS_MOBILE,
  INITIAL_THUMBNAILS_DESKTOP,
  isMobile,
} from '../utils/crashRecovery';

// Contexts
import WhiteLabelingContext from '../context/WhiteLabelingContext.js';
import UserManagerContext from '../context/UserManagerContext';
import AppContext from '../context/AppContext';

import './Viewer.css';
import StudyPrefetcher from '../components/StudyPrefetcher.js';
import StudyLoadingMonitor from '../components/StudyLoadingMonitor';

const { studyMetadataManager } = OHIF.utils;

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.arrayOf(
      PropTypes.shape({
        StudyInstanceUID: PropTypes.string.isRequired,
        StudyDate: PropTypes.string,
        PatientID: PropTypes.string,
        displaySets: PropTypes.arrayOf(
          PropTypes.shape({
            displaySetInstanceUID: PropTypes.string.isRequired,
            SeriesDescription: PropTypes.string,
            SeriesNumber: PropTypes.number,
            InstanceNumber: PropTypes.number,
            numImageFrames: PropTypes.number,
            Modality: PropTypes.string.isRequired,
            images: PropTypes.arrayOf(
              PropTypes.shape({
                getImageId: PropTypes.func.isRequired,
              })
            ),
          })
        ),
      })
    ),
    studyInstanceUIDs: PropTypes.array,
    activeServer: PropTypes.shape({
      type: PropTypes.string,
      wadoRoot: PropTypes.string,
    }),
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
    // window.store.getState().viewports.viewportSpecificData
    viewports: PropTypes.object.isRequired,
    // window.store.getState().viewports.activeViewportIndex
    activeViewportIndex: PropTypes.number.isRequired,
    isStudyLoaded: PropTypes.bool,
    dialog: PropTypes.object,
  };

  constructor(props) {
    super(props);

    const { activeServer } = this.props;
    const server = Object.assign({}, activeServer);

    const external = { servicesManager };

    OHIF.measurements.MeasurementApi.setConfiguration({
      dataExchange: {
        retrieve: server => DICOMSR.retrieveMeasurements(server, external),
        store: DICOMSR.storeMeasurements,
      },
      server,
    });

    OHIF.measurements.TimepointApi.setConfiguration({
      dataExchange: {
        retrieve: this.retrieveTimepoints,
        store: this.storeTimepoints,
        remove: this.removeTimepoint,
        update: this.updateTimepoint,
        disassociate: this.disassociateStudy,
      },
    });

    this._getActiveViewport = this._getActiveViewport.bind(this);
  }

  state = {
    isLeftSidePanelOpen: true,
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    thumbnails: [],
    // Stability Mode
    stabilityMode: false,
    stabilityResult: null, // { stabilityMode, crashDetected, largeStudy, reason, ... }
    visibleThumbnailLimit: isMobile() ? INITIAL_THUMBNAILS_MOBILE : INITIAL_THUMBNAILS_DESKTOP,
    showLoadMorePrompt: false,
    bannerDismissed: false,
    // Single-series tab mode
    singleSeriesMode: false,
    targetSeriesInstanceUID: null,
  };

  componentWillUnmount() {
    if (this.props.dialog) {
      this.props.dialog.dismissAll();
    }

    document.removeEventListener(
      'segmentationLoadingError',
      this._updateThumbnails
    );
  }

  retrieveTimepoints = filter => {
    OHIF.log.info('retrieveTimepoints');

    // Get the earliest and latest study date
    let earliestDate = new Date().toISOString();
    let latestDate = new Date().toISOString();
    if (this.props.studies) {
      latestDate = new Date('1000-01-01').toISOString();
      this.props.studies.forEach(study => {
        const StudyDate = moment(study.StudyDate, 'YYYYMMDD').toISOString();
        if (StudyDate < earliestDate) {
          earliestDate = StudyDate;
        }
        if (StudyDate > latestDate) {
          latestDate = StudyDate;
        }
      });
    }

    // Return a generic timepoint
    return Promise.resolve([
      {
        timepointType: 'baseline',
        timepointId: 'TimepointId',
        studyInstanceUIDs: this.props.studyInstanceUIDs,
        PatientID: filter.PatientID,
        earliestDate,
        latestDate,
        isLocked: false,
      },
    ]);
  };

  storeTimepoints = timepointData => {
    OHIF.log.info('storeTimepoints');
    return Promise.resolve();
  };

  updateTimepoint = (timepointData, query) => {
    OHIF.log.info('updateTimepoint');
    return Promise.resolve();
  };

  removeTimepoint = timepointId => {
    OHIF.log.info('removeTimepoint');
    return Promise.resolve();
  };

  disassociateStudy = (timepointIds, StudyInstanceUID) => {
    OHIF.log.info('disassociateStudy');
    return Promise.resolve();
  };

  onTimepointsUpdated = timepoints => {
    if (this.props.onTimepointsUpdated) {
      this.props.onTimepointsUpdated(timepoints);
    }
  };

  onMeasurementsUpdated = measurements => {
    if (this.props.onMeasurementsUpdated) {
      this.props.onMeasurementsUpdated(measurements);
    }
  };

  componentDidMount() {
    const { studies, isStudyLoaded } = this.props;
    const { TimepointApi, MeasurementApi } = OHIF.measurements;
    const currentTimepointId = 'TimepointId';

    const timepointApi = new TimepointApi(currentTimepointId, {
      onTimepointsUpdated: this.onTimepointsUpdated,
    });

    const measurementApi = new MeasurementApi(timepointApi, {
      onMeasurementsUpdated: this.onMeasurementsUpdated,
    });

    this.currentTimepointId = currentTimepointId;
    this.timepointApi = timepointApi;
    this.measurementApi = measurementApi;

    if (studies) {
      const PatientID = studies[0] && studies[0].PatientID;

      timepointApi.retrieveTimepoints({ PatientID });
      if (isStudyLoaded) {
        this.measurementApi.retrieveMeasurements(PatientID, [
          currentTimepointId,
        ]);
      }

      const activeViewport = this.props.viewports[
        this.props.activeViewportIndex
      ];
      const activeDisplaySetInstanceUID = activeViewport
        ? activeViewport.displaySetInstanceUID
        : undefined;

      // ── Single-series tab mode detection ──
      const urlParams = new URLSearchParams(window.location.search);
      const singleSeriesMode = urlParams.get('singleSeries') === 'true';
      const targetSeriesInstanceUID = urlParams.get('SeriesInstanceUID');

      // Use filteredStudies so we don't mutate frozen Redux props
      let filteredStudies = studies;

      if (singleSeriesMode && targetSeriesInstanceUID) {
        console.log('[SINGLE SERIES MODE]', {
          singleSeriesMode,
          targetSeriesInstanceUID,
        });

        // Filter each study's displaySets to only the target series
        filteredStudies = studies.map(study => ({
          ...study,
          displaySets: (study.displaySets || []).filter(ds => {
            const match = (ds.SeriesInstanceUID || '').toLowerCase() === targetSeriesInstanceUID.toLowerCase();
            if (!match) {
              console.log('[SINGLE SERIES FILTER] Skipped:', ds.SeriesDescription || ds.SeriesNumber, ds.SeriesInstanceUID);
            }
            return match;
          }),
        }));

        console.log('[SINGLE SERIES FILTER]', {
          targetSeriesInstanceUID,
          filteredDisplaySets: filteredStudies.reduce((sum, s) => sum + (s.displaySets || []).length, 0),
        });

        // If no matching series found, keep original studies (don't break viewer)
        const hasAnyDisplaySets = filteredStudies.some(s => (s.displaySets || []).length > 0);
        if (!hasAnyDisplaySets) {
          console.warn('[SINGLE SERIES FILTER] No matching series found — showing full study');
          filteredStudies = studies;
        }
      }

      // Use filteredStudies for all subsequent processing

      // ── Stability Mode check ──
      // Single-series mode: never need stability protections
      let stabilityResult = { stabilityMode: false, crashDetected: false, largeStudy: false, mobileLargeStudy: false, reason: 'single-series-mode' };
      let stabilityOn = false;

      if (!singleSeriesMode) {
        let totalDisplaySets = 0;
        filteredStudies.forEach(s => { totalDisplaySets += (s.displaySets || []).length; });
        stabilityResult = initStabilityMode(totalDisplaySets);
        stabilityOn = stabilityResult.stabilityMode;

        if (stabilityOn) {
          console.log('[OHIF Stability] Mode ON —', stabilityResult.reason);
        }

        console.log('[OHIF Stability Mode]', {
          stabilityMode: stabilityOn,
          crashRecoveryDetected: stabilityResult.crashDetected,
          largeStudyDetected: stabilityResult.largeStudy,
          mobileLargeStudyDetected: stabilityResult.mobileLargeStudy,
          manualOverride: getStabilityOverride(),
          displaySetCount: totalDisplaySets,
          visibleSeriesCount: stabilityOn ? limit : totalDisplaySets,
        });
      } else {
        // Clear any stale crash flag inherited from main tab
        try { sessionStorage.removeItem('ohif_crash_detected'); } catch(e) {}
        console.log('[OHIF Stability] Skipped — single-series mode');
      }

      // ── Build thumbnails from filtered studies ──
      const thumbnails = _mapStudiesToThumbnails(
        filteredStudies,
        activeDisplaySetInstanceUID
      );

      // ── Limit thumbnails if stability mode ──
      let visibleThumbnails = thumbnails;
      const limit = stabilityOn
        ? (isMobile() ? INITIAL_THUMBNAILS_MOBILE : INITIAL_THUMBNAILS_DESKTOP)
        : Infinity;

      if (stabilityOn) {
        visibleThumbnails = thumbnails.map(study => ({
          ...study,
          thumbnails: study.thumbnails.slice(0, limit),
          _allThumbnails: study.thumbnails,
        }));
      }

      this.setState({
        thumbnails: visibleThumbnails,
        stabilityMode: stabilityOn,
        stabilityResult,
        visibleThumbnailLimit: stabilityOn ? limit : 9999,
        singleSeriesMode,
        targetSeriesInstanceUID,
      });

      // ── Save initial session ──
      this._saveCurrentSession();
    }

    document.addEventListener(
      'segmentationLoadingError',
      this._updateThumbnails.bind(this),
      false
    );
  }

  componentDidUpdate(prevProps) {
    const {
      studies,
      isStudyLoaded,
      activeViewportIndex,
      viewports,
    } = this.props;

    const activeViewport = viewports[activeViewportIndex];
    const activeDisplaySetInstanceUID = activeViewport
      ? activeViewport.displaySetInstanceUID
      : undefined;

    const prevActiveViewport =
      prevProps.viewports[prevProps.activeViewportIndex];
    const prevActiveDisplaySetInstanceUID = prevActiveViewport
      ? prevActiveViewport.displaySetInstanceUID
      : undefined;

    if (
      studies !== prevProps.studies ||
      activeViewportIndex !== prevProps.activeViewportIndex ||
      activeDisplaySetInstanceUID !== prevActiveDisplaySetInstanceUID
    ) {
      // ── Apply single-series filter in componentDidUpdate too ──
      const { singleSeriesMode, targetSeriesInstanceUID } = this.state;
      let effectiveStudies = studies;
      if (singleSeriesMode && targetSeriesInstanceUID) {
        effectiveStudies = studies.map(study => ({
          ...study,
          displaySets: (study.displaySets || []).filter(ds =>
            (ds.SeriesInstanceUID || '').toLowerCase() === targetSeriesInstanceUID.toLowerCase()
          ),
        }));
      }

      const thumbnails = _mapStudiesToThumbnails(
        effectiveStudies,
        activeDisplaySetInstanceUID
      );

      // ── Stability: limit thumbnails ──
      let totalDisplaySets = 0;
      effectiveStudies.forEach(s => { totalDisplaySets += (s.displaySets || []).length; });
      const stabilityOn = this.state.stabilityMode;

      let visibleThumbnails = thumbnails;
      if (stabilityOn) {
        visibleThumbnails = thumbnails.map(study => ({
          ...study,
          thumbnails: study.thumbnails.slice(0, this.state.visibleThumbnailLimit),
          _allThumbnails: study.thumbnails,
        }));
      }

      this.setState({
        thumbnails: visibleThumbnails,
        activeDisplaySetInstanceUID,
      });

      // Save session on meaningful change
      this._saveCurrentSession();
    }
    if (isStudyLoaded && isStudyLoaded !== prevProps.isStudyLoaded) {
      const PatientID = studies[0] && studies[0].PatientID;
      const { currentTimepointId } = this;

      this.timepointApi.retrieveTimepoints({ PatientID });
      this.measurementApi
        .retrieveMeasurements(PatientID, [currentTimepointId])
        .then(() => {
          this._updateThumbnails();
        });
    }
  }

  _updateThumbnails() {
    const { studies, activeViewportIndex, viewports } = this.props;
    const { singleSeriesMode, targetSeriesInstanceUID } = this.state;

    // Filter to single series in single-series mode
    let effectiveStudies = studies;
    if (singleSeriesMode && targetSeriesInstanceUID) {
      effectiveStudies = studies.map(study => ({
        ...study,
        displaySets: (study.displaySets || []).filter(ds =>
          (ds.SeriesInstanceUID || '').toLowerCase() === targetSeriesInstanceUID.toLowerCase()
        ),
      }));
    }

    const activeViewport = viewports[activeViewportIndex];
    const activeDisplaySetInstanceUID = activeViewport
      ? activeViewport.displaySetInstanceUID
      : undefined;

    this.setState({
      thumbnails: _mapStudiesToThumbnails(effectiveStudies, activeDisplaySetInstanceUID),
      activeDisplaySetInstanceUID,
    });
  }

  _getActiveViewport() {
    return this.props.viewports[this.props.activeViewportIndex];
  }

  /**
   * Save current viewer session to localStorage for crash recovery.
   */
  _saveCurrentSession() {
    try {
      const { studies, viewports, activeViewportIndex } = this.props;
      if (!studies || !studies.length) return;

      const activeVp = viewports[activeViewportIndex];
      const session = {
        studyInstanceUIDs: studies.map(s => s.StudyInstanceUID),
        StudyInstanceUID: studies[0] ? studies[0].StudyInstanceUID : null,
        SeriesInstanceUID: activeVp ? activeVp.SeriesInstanceUID || null : null,
        displaySetInstanceUID: activeVp ? activeVp.displaySetInstanceUID || null : null,
        currentRoute: window.location.pathname,
        viewportLayout: {
          rows: activeVp ? (activeVp.viewportData ? activeVp.viewportData.rows : 1) : 1,
          columns: activeVp ? (activeVp.viewportData ? activeVp.viewportData.columns : 1) : 1,
        },
        activeViewportIndex,
        imageIndex: activeVp ? activeVp.imageIndex || 0 : 0,
      };
      saveSession(session);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Snapshot for error boundary (synchronous, no props access issues).
   */
  getSessionSnapshot = () => {
    try {
      const { studies, viewports, activeViewportIndex } = this.props;
      if (!studies || !studies.length) return null;
      const activeVp = viewports[activeViewportIndex];
      return {
        StudyInstanceUID: studies[0] ? studies[0].StudyInstanceUID : null,
        displaySetInstanceUID: activeVp ? activeVp.displaySetInstanceUID || null : null,
        SeriesInstanceUID: activeVp ? activeVp.SeriesInstanceUID || null : null,
        currentRoute: window.location.pathname,
      };
    } catch (e) {
      return null;
    }
  };

  handleShowMoreSeries = () => {
    this.setState(prev => {
      const newLimit = prev.visibleThumbnailLimit + SERIES_INCREMENT;
      const thumbnails = _mapStudiesToThumbnails(
        this.props.studies,
        this.props.viewports[this.props.activeViewportIndex]
          ? this.props.viewports[this.props.activeViewportIndex].displaySetInstanceUID
          : undefined
      );
      return {
        visibleThumbnailLimit: newLimit,
        showLoadMorePrompt: false,
        thumbnails: thumbnails.map(s => ({
          ...s,
          _allThumbnails: s._allThumbnails || s.thumbnails,
          thumbnails: (s._allThumbnails || s.thumbnails).slice(0, newLimit),
        })),
      };
    });
  };

  /**
   * Handle scroll in series panel — show "Load more" prompt if near bottom
   */
  handleSeriesScroll = (event) => {
    const el = event.currentTarget;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const hasMore = this.state.thumbnails.some(
      s => s._allThumbnails && s._allThumbnails.length > this.state.visibleThumbnailLimit
    );
    if (distFromBottom < 160 && hasMore && !this.state.showLoadMorePrompt) {
      this.setState({ showLoadMorePrompt: true });
    }
  };

  /**
   * Turn stability mode on/off manually
   */
  handleToggleStabilityMode = () => {
    const currentOn = this.state.stabilityMode;
    if (currentOn) {
      // Turning OFF — show confirmation if large study
      if (this.state.stabilityResult && this.state.stabilityResult.largeStudy) {
        const confirmed = window.confirm(
          'Turning off Stability Mode may increase memory use and may cause the viewer to reload on large studies.'
        );
        if (!confirmed) return;
      }
      setStabilityOverride('off');
      // Show all thumbnails
      const allThumbnails = _mapStudiesToThumbnails(
        this.props.studies,
        this.props.viewports[this.props.activeViewportIndex]
          ? this.props.viewports[this.props.activeViewportIndex].displaySetInstanceUID
          : undefined
      );
      this.setState({
        stabilityMode: false,
        stabilityResult: { ...this.state.stabilityResult, stabilityMode: false, reason: 'manual_off' },
        visibleThumbnailLimit: 9999,
        thumbnails: allThumbnails,
      });
    } else {
      // Turning ON
      setStabilityOverride('on');
      const limit = isMobile() ? INITIAL_THUMBNAILS_MOBILE : INITIAL_THUMBNAILS_DESKTOP;
      const thumbnails = _mapStudiesToThumbnails(
        this.props.studies,
        this.props.viewports[this.props.activeViewportIndex]
          ? this.props.viewports[this.props.activeViewportIndex].displaySetInstanceUID
          : undefined
      );
      this.setState({
        stabilityMode: true,
        stabilityResult: { ...this.state.stabilityResult, stabilityMode: true, reason: 'manual_on' },
        visibleThumbnailLimit: limit,
        thumbnails: thumbnails.map(s => ({
          ...s,
          _allThumbnails: s._allThumbnails || s.thumbnails,
          thumbnails: (s._allThumbnails || s.thumbnails).slice(0, limit),
        })),
      });
    }
  };

  handleDismissBanner = () => {
    hideStabilityBanner();
    this.setState({ bannerDismissed: true });
  };

  handleOpenFullStudy = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('singleSeries');
    url.searchParams.delete('SeriesInstanceUID');
    window.location.href = url.toString();
  };

  render() {
    let VisiblePanelLeft, VisiblePanelRight;
    const panelExtensions = extensionManager.modules[MODULE_TYPES.PANEL];

    panelExtensions.forEach(panelExt => {
      panelExt.module.components.forEach(comp => {
        if (comp.id === this.state.selectedRightSidePanel) {
          VisiblePanelRight = comp.component;
        } else if (comp.id === this.state.selectedLeftSidePanel) {
          VisiblePanelLeft = comp.component;
        }
      });
    });

    const { stabilityMode, stabilityResult, thumbnails, visibleThumbnailLimit, showLoadMorePrompt, bannerDismissed, singleSeriesMode, targetSeriesInstanceUID } = this.state;
    const bannerText = stabilityResult ? getStabilityBannerText(stabilityResult) : null;
    const showBanner = stabilityMode && bannerText && !bannerDismissed && !isStabilityBannerHidden();
    const isLargeStudy = stabilityResult && stabilityResult.largeStudy;
    const isCrashDetected = stabilityResult && stabilityResult.crashDetected;

    // Check if any study has hidden thumbnails
    // Don't show "Load more" in single-series mode — only 1 series exists
    const hasMoreSeries = singleSeriesMode
      ? false
      : thumbnails.some(
        s => s._allThumbnails && s._allThumbnails.length > visibleThumbnailLimit
      );

    return (
      <ViewerErrorBoundary
        onSaveSession={this.getSessionSnapshot}
      >
        {/* HEADER */}
        <WhiteLabelingContext.Consumer>
          {whiteLabeling => (
            <UserManagerContext.Consumer>
              {userManager => (
                <AppContext.Consumer>
                  {appContext => (
                    <ConnectedHeader
                      linkText={
                        appContext.appConfig.showStudyList
                          ? 'Study List'
                          : undefined
                      }
                      linkPath={
                        appContext.appConfig.showStudyList ? '/' : undefined
                      }
                      userManager={userManager}
                    >
                      {whiteLabeling &&
                        whiteLabeling.createLogoComponentFn &&
                        whiteLabeling.createLogoComponentFn(React)}
                    </ConnectedHeader>
                  )}
                </AppContext.Consumer>
              )}
            </UserManagerContext.Consumer>
          )}
        </WhiteLabelingContext.Consumer>

        {/* STABILITY MODE BANNER */}
        {showBanner && (
          <div className="stability-banner">
            <div className="stability-banner-inner">
              <span className="stability-banner-icon">
                {isCrashDetected ? '↻' : '⚡'}
              </span>
              <span className="stability-banner-text">
                {bannerText}
                {isLargeStudy && (
                  <span className="stability-banner-hint">
                    For transfer or offline review, use ZIP on individual series instead of loading all series.
                  </span>
                )}
              </span>
              <span className="stability-banner-actions">
                <button
                  className="stability-banner-btn stability-banner-btn-keep"
                  onClick={this.handleDismissBanner}
                >
                  Keep On
                </button>
                <button
                  className="stability-banner-btn stability-banner-btn-off"
                  onClick={() => {
                    this.handleToggleStabilityMode();
                    this.handleDismissBanner();
                  }}
                >
                  Turn Off
                </button>
                <button
                  className="stability-banner-btn stability-banner-btn-close"
                  onClick={this.handleDismissBanner}
                  title="Close"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>
        )}

        {/* SINGLE-SERIES MODE BANNER */}
        {singleSeriesMode && targetSeriesInstanceUID && (
          <div className="stability-banner single-series-banner">
            <div className="stability-banner-inner">
              <span className="stability-banner-icon">
                ◉
              </span>
              <span className="stability-banner-text">
                Single-series mode: only this sequence is loaded for stability.
              </span>
              <span className="stability-banner-actions">
                <button
                  className="stability-banner-btn stability-banner-btn-keep"
                  onClick={this.handleOpenFullStudy}
                >
                  Open Full Study
                </button>
              </span>
            </div>
          </div>
        )}

        {/* TOOLBAR */}
        <ErrorBoundaryDialog context="ToolbarRow">
          <ToolbarRow
            activeViewport={
              this.props.viewports[this.props.activeViewportIndex]
            }
            isLeftSidePanelOpen={this.state.isLeftSidePanelOpen}
            isRightSidePanelOpen={this.state.isRightSidePanelOpen}
            selectedLeftSidePanel={
              this.state.isLeftSidePanelOpen
                ? this.state.selectedLeftSidePanel
                : ''
            }
            selectedRightSidePanel={
              this.state.isRightSidePanelOpen
                ? this.state.selectedRightSidePanel
                : ''
            }
            stabilityMode={stabilityMode}
            onToggleStabilityMode={this.handleToggleStabilityMode}
            handleSidePanelChange={(side, selectedPanel) => {
              const sideClicked = side && side[0].toUpperCase() + side.slice(1);
              const openKey = `is${sideClicked}SidePanelOpen`;
              const selectedKey = `selected${sideClicked}SidePanel`;
              const updatedState = Object.assign({}, this.state);

              const isOpen = updatedState[openKey];
              const prevSelectedPanel = updatedState[selectedKey];
              // RoundedButtonGroup returns `null` if selected button is clicked
              const isSameSelectedPanel =
                prevSelectedPanel === selectedPanel || selectedPanel === null;

              updatedState[selectedKey] = selectedPanel || prevSelectedPanel;

              const isClosedOrShouldClose = !isOpen || isSameSelectedPanel;
              if (isClosedOrShouldClose) {
                updatedState[openKey] = !updatedState[openKey];
              }

              this.setState(updatedState);
            }}
            studies={this.props.studies}
          />
        </ErrorBoundaryDialog>
        <AppContext.Consumer>
          {appContext => <StudyLoadingMonitor studies={this.props.studies} />}
        </AppContext.Consumer>
        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <ErrorBoundaryDialog context="LeftSidePanel">
            <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
              {VisiblePanelLeft ? (
                <VisiblePanelLeft
                  viewports={this.props.viewports}
                  studies={this.props.studies}
                  activeIndex={this.props.activeViewportIndex}
                />
              ) : (
                <AppContext.Consumer>
                  {appContext => {
                    const { appConfig } = appContext;
                    const studyPrefetcher = appConfig.studyPrefetcher;
                    const prefetchEnabled = !stabilityMode && studyPrefetcher && studyPrefetcher.enabled;
                    return (
                      <div
                        className="series-scroll-container"
                        onScroll={this.handleSeriesScroll}
                      >
                        <ConnectedStudyBrowser
                          studies={thumbnails}
                          studyMetadata={this.props.studies}
                          showThumbnailProgressBar={
                            prefetchEnabled &&
                            studyPrefetcher.displayProgress
                          }
                          stabilityMode={stabilityMode}
                        />
                        {/* Scroll load-more prompt */}
                        {showLoadMorePrompt && hasMoreSeries && (
                          <div className="load-more-prompt">
                            <span className="load-more-prompt-text">
                              Load more series?
                            </span>
                            <button
                              className="load-more-prompt-btn load-more-prompt-btn-yes"
                              onClick={this.handleShowMoreSeries}
                            >
                              Load 20 more
                            </button>
                            <button
                              className="load-more-prompt-btn load-more-prompt-btn-no"
                              onClick={() => this.setState({ showLoadMorePrompt: false })}
                            >
                              Not now
                            </button>
                          </div>
                        )}
                        {/* Manual load-more button */}
                        {hasMoreSeries && (
                          <button
                            className="load-more-manual-btn"
                            onClick={this.handleShowMoreSeries}
                          >
                            Load more series
                          </button>
                        )}
                      </div>
                    );
                  }}
                </AppContext.Consumer>
              )}
            </SidePanel>
          </ErrorBoundaryDialog>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ErrorBoundaryDialog context="ViewerMain">
              <AppContext.Consumer>
                {appContext => {
                  const { appConfig } = appContext;
                  const studyPrefetcher = appConfig.studyPrefetcher;
                  const { studies } = this.props;
                  const prefetchEnabled = !stabilityMode && studyPrefetcher && studyPrefetcher.enabled;
                  return (
                    prefetchEnabled && (
                      <StudyPrefetcher
                        studies={studies}
                        options={studyPrefetcher}
                      />
                    )
                  );
                }}
              </AppContext.Consumer>
              <ConnectedViewerMain
                studies={this.props.studies}
                isStudyLoaded={this.props.isStudyLoaded}
              />
            </ErrorBoundaryDialog>
          </div>

          {/* RIGHT */}
          <ErrorBoundaryDialog context="RightSidePanel">
            <SidePanel from="right" isOpen={this.state.isRightSidePanelOpen}>
              {VisiblePanelRight && (
                <VisiblePanelRight
                  isOpen={this.state.isRightSidePanelOpen}
                  viewports={this.props.viewports}
                  studies={this.props.studies}
                  activeIndex={this.props.activeViewportIndex}
                  activeViewport={
                    this.props.viewports[this.props.activeViewportIndex]
                  }
                  getActiveViewport={this._getActiveViewport}
                />
              )}
            </SidePanel>
          </ErrorBoundaryDialog>
        </div>
      </ViewerErrorBoundary>
    );
  }
}

export default withDialog(Viewer);

/**
 * Async function to check if the displaySet has any derived one
 *
 * @param {*object} displaySet
 * @param {*object} study
 * @returns {bool}
 */
const _checkForDerivedDisplaySets = async function(displaySet, study) {
  let derivedDisplaySetsNumber = 0;
  if (
    displaySet.Modality &&
    !['SEG', 'SR', 'RTSTRUCT'].includes(displaySet.Modality)
  ) {
    const studyMetadata = studyMetadataManager.get(study.StudyInstanceUID);

    const derivedDisplaySets = studyMetadata.getDerivedDatasets({
      referencedSeriesInstanceUID: displaySet.SeriesInstanceUID,
    });

    derivedDisplaySetsNumber = derivedDisplaySets.length;
  }

  return derivedDisplaySetsNumber > 0;
};

/**
 * Async function to check if there are any inconsistences in the series.
 *
 * For segmentation returns any error during loading.
 *
 * For reconstructable 3D volume:
 * 1) Is series multiframe?
 * 2) Do the frames have different dimensions/number of components/orientations?
 * 3) Has the series any missing frames or irregular spacing?
 * 4) Is the series 4D?
 *
 * If not reconstructable, MPR is disabled.
 * The actual computations are done in isDisplaySetReconstructable.
 *
 * @param {*object} displaySet
 * @returns {[string]} an array of strings containing the warnings
 */
const _checkForSeriesInconsistencesWarnings = async function(displaySet) {
  const inconsistencyWarnings = [];

  if (displaySet.Modality !== 'SEG') {
    // warnings already checked and cached in displaySet
    if (displaySet.inconsistencyWarnings) {
      return displaySet.inconsistencyWarnings;
    }

    if (
      displaySet.reconstructionIssues &&
      displaySet.reconstructionIssues.length !== 0
    ) {
      displaySet.reconstructionIssues.forEach(warning => {
        switch (warning) {
          case ReconstructionIssues.DATASET_4D:
            inconsistencyWarnings.push('The dataset is 4D.');
            break;
          case ReconstructionIssues.VARYING_IMAGESDIMENSIONS:
            inconsistencyWarnings.push(
              'The dataset frames have different dimensions (rows, columns).'
            );
            break;
          case ReconstructionIssues.VARYING_IMAGESCOMPONENTS:
            inconsistencyWarnings.push(
              'The dataset frames have different components (Sample per pixel).'
            );
            break;
          case ReconstructionIssues.VARYING_IMAGESORIENTATION:
            inconsistencyWarnings.push(
              'The dataset frames have different orientation.'
            );
            break;
          case ReconstructionIssues.IRREGULAR_SPACING:
            inconsistencyWarnings.push(
              'The dataset frames have different pixel spacing.'
            );
            break;
          case ReconstructionIssues.MULTIFFRAMES:
            inconsistencyWarnings.push('The dataset is a multiframes.');
            break;
          default:
            break;
        }
      });
      inconsistencyWarnings.push(
        'The datasets is not a reconstructable 3D volume. MPR mode is not available.'
      );
    }

    if (
      displaySet.missingFrames &&
      (!displaySet.reconstructionIssues ||
        (displaySet.reconstructionIssues &&
          !displaySet.reconstructionIssues.find(
            warn => warn === ReconstructionIssues.DATASET_4D
          )))
    ) {
      inconsistencyWarnings.push(
        'The datasets is missing frames: ' + displaySet.missingFrames + '.'
      );
    }

    if (displaySet.isSOPClassUIDSupported === false) {
      inconsistencyWarnings.push('The datasets is not supported.');
    }
    displaySet.inconsistencyWarnings = inconsistencyWarnings;
  } else {
    if (displaySet.loadError) {
      inconsistencyWarnings.push(displaySet.segLoadErrorMessagge);
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
    }
  }

  return inconsistencyWarnings;
};

/**
 * Checks if display set is active, i.e. if the series is currently shown
 * in the active viewport.
 *
 * For data display set, this functions checks if the active
 * display set instance uid in the current active viewport is the same of the
 * thumbnail one.
 *
 * For derived modalities (e.g., SEG and RTSTRUCT), the function gets the
 * reference display set and then checks the reference uid with the active
 * display set instance uid.
 *
 * @param {displaySet} displaySet
 * @param {Study[]} studies
 * @param {string} activeDisplaySetInstanceUID
 * @returns {boolean} is active.
 */
const _isDisplaySetActive = function(
  displaySet,
  studies,
  activeDisplaySetInstanceUID
) {
  let active = false;

  const { displaySetInstanceUID } = displaySet;

  // TO DO: in the future, we could possibly support new modalities
  // we should have a list of all modalities here, instead of having hard coded checks
  if (
    displaySet.Modality !== 'SEG' &&
    displaySet.Modality !== 'RTSTRUCT' &&
    displaySet.Modality !== 'SR'
  ) {
    active = activeDisplaySetInstanceUID === displaySetInstanceUID;
  } else if (displaySet.Modality === 'SR') {
    active = activeDisplaySetInstanceUID === displaySetInstanceUID;

    if (!active && displaySet.getSourceDisplaySet) {
      const referencedDisplaySet = displaySet.getSourceDisplaySet(
        studies,
        false
      );
      if (referencedDisplaySet && referencedDisplaySet.length !== 0) {
        for (let i = 0; i < referencedDisplaySet.length; i++) {
          if (
            referencedDisplaySet[i].displaySetInstanceUID ===
            activeDisplaySetInstanceUID
          ) {
            active = true;
            break;
          }
        }
      }
    }
  } else if (displaySet.getSourceDisplaySet) {
    if (displaySet.Modality === 'SEG') {
      const { referencedDisplaySet } = displaySet.getSourceDisplaySet(
        studies,
        false
      );
      active = referencedDisplaySet
        ? activeDisplaySetInstanceUID ===
          referencedDisplaySet.displaySetInstanceUID
        : false;
    } else {
      const referencedDisplaySet = displaySet.getSourceDisplaySet(
        studies,
        false
      );
      active = referencedDisplaySet
        ? activeDisplaySetInstanceUID ===
          referencedDisplaySet.displaySetInstanceUID
        : false;
    }
  }

  return active;
};

/**
 * What types are these? Why do we have "mapping" dropped in here instead of in
 * a mapping layer?
 *
 * TODO[react]:
 * - Add showStackLoadingProgressBar option
 *
 * @param {Study[]} studies
 * @param {string} activeDisplaySetInstanceUID
 */
const _mapStudiesToThumbnails = function(studies, activeDisplaySetInstanceUID) {
  // PadiMedical: filter out non-displayable series from thumbnails
  const hidePresentationStates = displaySet => {
    const sopClass = displaySet.SOPClassUIDNaturalized || '';
    const modality = displaySet.Modality || '';
    if (sopClass === 'RawData' || modality === 'RawData') return true;
    if (sopClass.includes('PresentationState') || modality === 'PR') return true;
    return false;
  };

  return studies.map(study => {
    const { StudyInstanceUID } = study;
    const thumbnails = study.displaySets
      .filter(displaySet => !hidePresentationStates(displaySet))
      .map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesInstanceUID,
        SeriesDescription,
        numImageFrames,
        SeriesNumber,
        Modality,
      } = displaySet;

      let imageId;
      let altImageText;

      const isActive = _isDisplaySetActive(
        displaySet,
        studies,
        activeDisplaySetInstanceUID
      );

      if (Modality === 'SEG') {
        altImageText = 'SEG';
      } else if (Modality === 'SR') {
        altImageText = 'SR';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);
        imageId = displaySet.images[imageIndex].getImageId();
      } else if (displaySet.isSOPClassUIDSupported === false) {
        altImageText = displaySet.SOPClassUIDNaturalized;
      } else {
        altImageText = Modality || 'UN';
      }

      const hasWarnings = _checkForSeriesInconsistencesWarnings(displaySet);

      const hasDerivedDisplaySets = _checkForDerivedDisplaySets(
        displaySet,
        study
      );

      return {
        active: isActive,
        imageId,
        altImageText,
        displaySetInstanceUID,
        SeriesInstanceUID,
        SeriesDescription,
        numImageFrames,
        SeriesNumber,
        Modality,
        hasWarnings,
        hasDerivedDisplaySets,
      };
    });

    return {
      StudyInstanceUID,
      thumbnails,
    };
  });
};
