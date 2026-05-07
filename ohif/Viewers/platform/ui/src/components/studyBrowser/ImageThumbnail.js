/* global cornerstone */
import './ImageThumbnail.styl';

import { utils } from '@ohif/core';
import React, { useState, useEffect, createRef, useCallback } from 'react';
import classNames from 'classnames';

import PropTypes from 'prop-types';
import ViewportErrorIndicator from '../../viewer/ViewportErrorIndicator';
import ViewportLoadingIndicator from '../../viewer/ViewportLoadingIndicator';

// TODO: How should we have this component depend on Cornerstone?
// - Passed in as a prop?
// - Set as external dependency?
// - Pass in the entire load and render function as a prop?
//import cornerstone from 'cornerstone-core';
function ImageThumbnail(props) {
  const {
    active,
    width,
    height,
    imageSrc,
    imageId,
    seriesInstanceUid,
    stackPercentComplete,
    error: propsError,
    showProgressBar,
  } = props;

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [image, setImage] = useState({});
  const [previewSrc, setPreviewSrc] = useState(null);
  const canvasRef = createRef();

  // Effective image source: prop or Orthanc preview
  const effectiveImageSrc = imageSrc || previewSrc;

  let loadingOrError;
  let cancelablePromise;

  if (propsError || error) {
    loadingOrError = <ViewportErrorIndicator />;
  } else if (isLoading) {
    loadingOrError = <ViewportLoadingIndicator />;
  }

  const showStackLoadingProgressBar =
    showProgressBar && stackPercentComplete !== undefined;

  // Use Orthanc preview endpoint instead of cornerstone for thumbnails.
  // This prevents cornerstone cache flooding on studies with many series (e.g. angiograms).
  const shouldRenderToCanvas = () => {
    return !effectiveImageSrc && imageId && active;
  };

  const fetchImagePromise = () => {
    if (!cancelablePromise) {
      return;
    }

    setLoading(true);
    cancelablePromise
      .then(response => {
        setImage(response);
      })
      .catch(error => {
        if (error.isCanceled) return;
        // setLoading(false);
        // setError(true);
        // throw new Error(error);
      });
  };

  const setImagePromise = () => {
    if (shouldRenderToCanvas()) {
      cancelablePromise = utils.makeCancelable(
        cornerstone.loadAndCacheImage(imageId)
      );
    }
  };

  const purgeCancelablePromise = useCallback(() => {
    if (cancelablePromise) {
      cancelablePromise.cancel();
    }
  });

  useEffect(() => {
    return () => {
      purgeCancelablePromise();
    };
  }, [purgeCancelablePromise]);

  useEffect(() => {
    if (image.imageId && canvasRef.current) {
      const canvas = canvasRef.current;
      if (canvas.width > 0 && canvas.height > 0) {
        try {
          cornerstone.renderToCanvas(canvas, image);
        } catch (err) {
          // Canvas not ready yet, cornerstone will retry
        }
      }
      setLoading(false);
    }
  }, [canvasRef, image, image.imageId]);

  // Fetch Orthanc series preview JPEG (bypasses cornerstone for thumbnails)
  useEffect(() => {
    if (imageId && seriesInstanceUid && !imageSrc && !previewSrc) {
      fetch(`/api/series/${seriesInstanceUid}/thumbnail`)
        .then(r => {
          if (!r.ok) throw new Error('Preview unavailable');
          return r.blob();
        })
        .then(blob => URL.createObjectURL(blob))
        .then(url => setPreviewSrc(url))
        .catch(() => {});
    }
  }, [imageId, seriesInstanceUid, active, imageSrc, previewSrc]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  useEffect(() => {
    if (!image.imageId || image.imageId !== imageId) {
      purgeCancelablePromise();
      setImagePromise();
      fetchImagePromise();
    }
  }, [
    fetchImagePromise,
    image.imageId,
    imageId,
    purgeCancelablePromise,
    setImagePromise,
  ]);

  return (
    <div className={classNames('ImageThumbnail', { active: active })}>
      <div className="image-thumbnail-canvas">
        {shouldRenderToCanvas() ? (
          <canvas ref={canvasRef} width={width} height={height} />
        ) : (
          <img
            className="static-image"
            src={effectiveImageSrc}
            height={height}
            alt={''}
          />
        )}
      </div>
      {loadingOrError}
      {showStackLoadingProgressBar && (
        <div className="image-thumbnail-progress-bar">
          <div
            className="image-thumbnail-progress-bar-inner"
            style={{ width: `${stackPercentComplete}%` }}
          />
        </div>
      )}
      {isLoading && <div className="image-thumbnail-loading-indicator"></div>}
    </div>
  );
}

ImageThumbnail.propTypes = {
  active: PropTypes.bool,
  imageSrc: PropTypes.string,
  imageId: PropTypes.string,
  seriesInstanceUid: PropTypes.string,
  error: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  stackPercentComplete: PropTypes.number.isRequired,
  showProgressBar: PropTypes.bool,
};

ImageThumbnail.defaultProps = {
  active: false,
  error: false,
  stackPercentComplete: 0,
  width: 217,
  height: 123,
  showProgressBar: true,
};

export default ImageThumbnail;
