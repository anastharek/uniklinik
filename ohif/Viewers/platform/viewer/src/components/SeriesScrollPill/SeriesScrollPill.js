import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './SeriesScrollPill.css';

/**
 * Pill-shaped scroll handle for the series thumbnail panel.
 * Floats on the right edge. Drag vertically to scroll the series list.
 * Works with both mouse and touch via window-level listeners.
 */

function SeriesScrollPill(props) {
  var scrollContainerRef = props.scrollContainerRef;
  var visible = props.visible;

  var pillRef = useRef(null);
  var trackRef = useRef(null);
  var dragRef = useRef({ active: false, startY: 0, startScrollTop: 0 });
  var rafRef = useRef(null);

  var _s = useState(48);
  var pillHeight = _s[0];
  var setPillHeight = _s[1];

  var _s2 = useState(0);
  var pillTop = _s2[0];
  var setPillTop = _s2[1];

  var _s3 = useState(false);
  var dragging = _s3[0];
  var setDragging = _s3[1];

  var _s4 = useState(false);
  var scrollable = _s4[0];
  var setScrollable = _s4[1];

  // ── Sync pill position from container scroll ──
  var syncPosition = useCallback(function() {
    var c = scrollContainerRef && scrollContainerRef.current;
    if (!c) return;

    var maxScroll = c.scrollHeight - c.clientHeight;
    var isScrollable = maxScroll > 20;

    setScrollable(isScrollable);

    if (!isScrollable) {
      setPillTop(0);
      return;
    }

    var ratio = maxScroll > 0 ? c.scrollTop / maxScroll : 0;
    var trackH = c.clientHeight;
    var pH = pillHeight;

    // Proportional pill height
    var idealH = (trackH / c.scrollHeight) * trackH;
    if (idealH < 48) idealH = 48;
    if (idealH > trackH * 0.85) idealH = trackH * 0.85;

    if (Math.abs(idealH - pH) > 2) {
      setPillHeight(idealH);
      pH = idealH;
    }

    var maxPillTop = trackH - pH;
    var newTop = ratio * maxPillTop;

    if (newTop < 0) newTop = 0;
    if (newTop > maxPillTop) newTop = maxPillTop;

    setPillTop(newTop);
  }, [scrollContainerRef, pillHeight]);

  // ── Scroll the container by a given amount ──
  var scrollBy = useCallback(function(dy) {
    var c = scrollContainerRef && scrollContainerRef.current;
    if (!c) return;

    var maxScroll = c.scrollHeight - c.clientHeight;
    if (maxScroll <= 0) return;

    var trackH = c.clientHeight;
    var pH = pillHeight;
    if (pH <= 0) pH = 48;

    var ratio = maxScroll / Math.max(trackH - pH, 1);
    var newST = dragRef.current.startScrollTop + dy * ratio;

    if (newST < 0) newST = 0;
    if (newST > maxScroll) newST = maxScroll;

    // Use scrollTo instead of setting scrollTop (better iOS compat)
    try {
      c.scrollTo(0, newST);
    } catch (e) {
      c.scrollTop = newST;
    }
  }, [scrollContainerRef, pillHeight]);

  // ── Event handlers that run on WINDOW (so drag continues off-pill) ──
  var startDrag = useCallback(function(clientY) {
    var c = scrollContainerRef && scrollContainerRef.current;
    if (!c) return;

    dragRef.current = {
      active: true,
      startY: clientY,
      startScrollTop: c.scrollTop,
    };
    setDragging(true);

    window.addEventListener('pointermove', onWinPointerMove, { passive: false });
    window.addEventListener('pointerup', onWinPointerUp);
    window.addEventListener('pointercancel', onWinPointerUp);
    // Touch fallback for iOS
    window.addEventListener('touchmove', onWinTouchMove, { passive: false });
    window.addEventListener('touchend', onWinTouchEnd);
    window.addEventListener('touchcancel', onWinTouchEnd);

    if (pillRef.current) pillRef.current.style.opacity = '1';
  }, [scrollContainerRef, scrollBy]);

  var endDrag = useCallback(function() {
    dragRef.current.active = false;
    setDragging(false);

    window.removeEventListener('pointermove', onWinPointerMove);
    window.removeEventListener('pointerup', onWinPointerUp);
    window.removeEventListener('pointercancel', onWinPointerUp);
    window.removeEventListener('touchmove', onWinTouchMove);
    window.removeEventListener('touchend', onWinTouchEnd);
    window.removeEventListener('touchcancel', onWinTouchEnd);

    if (pillRef.current) pillRef.current.style.opacity = '0.45';
  }, []);

  // ── Window-level pointer/touch handlers ──
  // These need to be stable refs so add/remove works correctly
  var onWinPointerMove = useCallback(function(e) {
    if (!dragRef.current.active) return;
    e.preventDefault();
    scrollBy(e.clientY - dragRef.current.startY);
  }, [scrollBy]);

  var onWinPointerUp = useCallback(function(e) {
    if (!dragRef.current.active) return;
    endDrag();
  }, [endDrag]);

  var onWinTouchMove = useCallback(function(e) {
    if (!dragRef.current.active) return;
    if (e.cancelable) e.preventDefault();
    var touch = e.touches && e.touches[0];
    if (touch) {
      scrollBy(touch.clientY - dragRef.current.startY);
    }
  }, [scrollBy]);

  var onWinTouchEnd = useCallback(function(e) {
    if (!dragRef.current.active) return;
    endDrag();
  }, [endDrag]);

  // ── Pill element handlers (only pointerdown starts drag) ──
  var onPillPointerDown = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientY);
  }, [startDrag]);

  var onPillTouchStart = useCallback(function(e) {
    // Don't preventDefault here — let the browser handle, we use window touchmove
    var touch = e.touches && e.touches[0];
    if (touch) {
      startDrag(touch.clientY);
    }
  }, [startDrag]);

  // ── Setup ──
  useEffect(function() {
    var c = scrollContainerRef && scrollContainerRef.current;
    if (!c) return;

    syncPosition();

    c.addEventListener('scroll', syncPosition, { passive: true });

    var obs = new MutationObserver(function() {
      syncPosition();
    });
    obs.observe(c, { childList: true, subtree: true });

    var resizeTimer;
    var onResize = function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncPosition, 80);
    };
    window.addEventListener('resize', onResize);

    return function() {
      c.removeEventListener('scroll', syncPosition);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      // Safety: clean up any lingering listeners
      window.removeEventListener('pointermove', onWinPointerMove);
      window.removeEventListener('pointerup', onWinPointerUp);
      window.removeEventListener('pointercancel', onWinPointerUp);
      window.removeEventListener('touchmove', onWinTouchMove);
      window.removeEventListener('touchend', onWinTouchEnd);
      window.removeEventListener('touchcancel', onWinTouchEnd);
    };
  }, [scrollContainerRef, syncPosition]);

  // Re-sync when visibility changes
  useEffect(function() {
    if (visible) syncPosition();
  }, [visible, syncPosition]);

  // ── Render ──
  if (!visible) return null;

  return (
    React.createElement('div', {
      ref: trackRef,
      className: 'series-scroll-pill-track' + (scrollable ? ' pill-visible' : ''),
    },
      React.createElement('div', {
        ref: pillRef,
        className: 'series-scroll-pill' + (dragging ? ' dragging' : ''),
        style: { height: pillHeight + 'px', top: pillTop + 'px' },
        onPointerDown: onPillPointerDown,
        onTouchStart: onPillTouchStart,
        title: 'Scroll series list',
        'aria-label': 'Scroll series list',
        role: 'scrollbar',
      })
    )
  );
}

SeriesScrollPill.propTypes = {
  scrollContainerRef: PropTypes.object.isRequired,
  visible: PropTypes.bool,
};

export default SeriesScrollPill;
