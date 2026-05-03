import React from 'react';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import './StudyBrowser.styl';

function StudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
    showThumbnailProgressBar,
  } = props;

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

              // Show button for real image series (not SR, SEG, PR, RawData)
              const showLoad = imageId && Modality !== 'SR' && Modality !== 'SEG' && Modality !== 'PR';

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
                  {showLoad && (
                    <button
                      className="series-download-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onThumbnailClick(displaySetInstanceUID);
                      }}
                      title="Load this series into the viewer"
                    >
                      {active ? (
                        <span className="download-loaded">✓ Loaded</span>
                      ) : (
                        <span>⬇ Load Series</span>
                      )}
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
