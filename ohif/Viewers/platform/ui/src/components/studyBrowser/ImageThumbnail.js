/* global cornerstone */
import './ImageThumbnail.styl';

import { utils } from '@ohif/core';
import React, { useState, useEffect, createRef, useCallback } from 'react';
import classNames from 'classnames';

import PropTypes from 'prop-types';

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
    zipProgress,
    isZipping,
  } = props;

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [image, setImage] = useState({});
  const [previewSrc, setPreviewSrc] = useState(null);
  const canvasRef = createRef();

  // Effective image source: prop or Orthanc preview
  const effectiveImageSrc = imageSrc || previewSrc;

  const showStackLoadingProgressBar =
    showProgressBar && stackPercentComplete !== undefined;

  // Use Orthanc preview endpoint instead of cornerstone for thumbnails
  const shouldRenderToCanvas = () => {
    return !effectiveImageSrc && imageId && active;
  };

  // ── Load and render via cornerstone (active only) ──
  let cancelablePromise;
  const fetchImagePromise = () => {
    if (!cancelablePromise) return;
    setLoading(true);
    cancelablePromise
      .then(response => setImage(response))
      .catch(error => {
        if (error.isCanceled) return;
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
    if (cancelablePromise) cancelablePromise.cancel();
  });

  useEffect(() => {
    return () => purgeCancelablePromise();
  }, [purgeCancelablePromise]);

  useEffect(() => {
    if (image.imageId && canvasRef.current) {
      const canvas = canvasRef.current;
      if (canvas.width > 0 && canvas.height > 0) {
        try { cornerstone.renderToCanvas(canvas, image); } catch (err) {}
      }
      setLoading(false);
    }
  }, [canvasRef, image, image.imageId]);

  // Fetch Orthanc series preview JPEG
  useEffect(() => {
    if (imageId && seriesInstanceUid && !imageSrc && !previewSrc) {
      fetch(`/api/series/${seriesInstanceUid}/thumbnail`)
        .then(r => { if (!r.ok) throw new Error('Preview unavailable'); return r.blob(); })
        .then(blob => URL.createObjectURL(blob))
        .then(url => setPreviewSrc(url))
        .catch(() => {});
    }
  }, [imageId, seriesInstanceUid, active, imageSrc, previewSrc]);

  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  useEffect(() => {
    if (!image.imageId || image.imageId !== imageId) {
      purgeCancelablePromise();
      setImagePromise();
      fetchImagePromise();
    }
  }, [fetchImagePromise, image.imageId, imageId, purgeCancelablePromise, setImagePromise]);

  // ── Determine progress state ──
  const hasLoadProgress = stackPercentComplete > 0 && stackPercentComplete < 100;
  const hasZipProgress = isZipping && zipProgress > 0 && zipProgress < 100;
  const showOverlay = hasLoadProgress || hasZipProgress;
  const overlayPercent = hasZipProgress ? zipProgress : stackPercentComplete;
  const overlayType = hasZipProgress ? 'zip' : 'load';

  return (
    <div className={classNames('ImageThumbnail', { active: active })}>
      <div className="image-thumbnail-canvas">
        {shouldRenderToCanvas() ? (
          <canvas ref={canvasRef} width={width} height={height} style={{ touchAction: 'pan-y' }} />
        ) : (
          <img
            className="static-image"
            src={effectiveImageSrc}
            height={height}
            alt={''}
          />
        )}
      </div>

      {/* ── Progress overlay (load or zip) ── */}
      {showOverlay && (
        <div className={classNames('thumbnail-progress-overlay', { 'zip-overlay': overlayType === 'zip' })}>
          <div className="percent-badge">
            {Math.round(overlayPercent)}%
          </div>
          <div className="progress-bar-edge">
            <div
              className={classNames('progress-bar-fill', { 'zip-fill': overlayType === 'zip' })}
              style={{ width: `${overlayPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Legacy progress bar (below thumbnail) ── */}
      {showStackLoadingProgressBar && !showOverlay && (
        <div className="image-thumbnail-progress-bar">
          <div
            className="image-thumbnail-progress-bar-inner"
            style={{ width: `${stackPercentComplete}%` }}
          />
        </div>
      )}

      {/* ── Plane indicator dot ── */}
      {props.planeIndicator && (
        <div
          className="plane-indicator"
          style={{ backgroundColor: props.planeIndicator }}
        />
      )}
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
  zipProgress: PropTypes.number,
  isZipping: PropTypes.bool,
  planeIndicator: PropTypes.string,
};

ImageThumbnail.defaultProps = {
  active: false,
  error: false,
  stackPercentComplete: 0,
  width: 217,
  height: 123,
  showProgressBar: true,
  isZipping: false,
  zipProgress: 0,
};

export default ImageThumbnail;
