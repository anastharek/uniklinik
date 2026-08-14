import React, { useEffect, useRef, useState } from 'react';

/**
 * Per-series preload control for the OHIF study browser (PUTRACNS).
 *
 * Calls the PACS backend /api/preload/series/:seriesUid which warms the
 * series' frames via the Osimis viewer image endpoints (Orthanc + OS page
 * cache), then polls GET until done, showing live progress %. Once warmed,
 * opening the series in the OHIF viewer is (near-)instant.
 *
 * State is also mirrored to localStorage so a ✓ persists across page loads
 * within the same browser (the server-side in-memory job is session-scoped).
 */
const LS_PREFIX = 'putracns_preload_series_';

const PreloadSeriesControl = ({ SeriesInstanceUID }: { SeriesInstanceUID?: string }): React.ReactNode => {
  const [state, setState] = useState<'idle' | 'preloading' | 'done' | 'error'>(() =>
    SeriesInstanceUID && localStorage.getItem(LS_PREFIX + SeriesInstanceUID) === 'done' ? 'done' : 'idle'
  );
  const [percent, setPercent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!SeriesInstanceUID) {
    return null;
  }

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const apply = data => {
    if (!mountedRef.current) return;
    if (data && data.status === 'done') {
      stopPolling();
      setState('done');
      setPercent(100);
      try {
        localStorage.setItem(LS_PREFIX + SeriesInstanceUID, 'done');
      } catch (e) {
        /* ignore */
      }
    } else if (data && data.status === 'error') {
      stopPolling();
      setState('error');
    } else if (data && typeof data.percent === 'number') {
      setPercent(data.percent);
    }
  };

  const start = async e => {
    e.stopPropagation();
    e.preventDefault();
    if (state === 'preloading' || state === 'done') return;
    setState('preloading');
    setPercent(0);
    const uid = encodeURIComponent(SeriesInstanceUID);
    try {
      const res = await fetch(`/api/preload/series/${uid}`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      apply(data);
      if (data && (data.status === 'queued' || data.status === 'running')) {
        timerRef.current = setInterval(async () => {
          try {
            const r = await fetch(`/api/preload/series/${uid}`, {
              credentials: 'include',
              cache: 'no-store',
            });
            const d = await r.json();
            apply(d);
            if (d && (d.status === 'done' || d.status === 'error')) {
              stopPolling();
            }
          } catch (err) {
            /* keep polling on transient network errors */
          }
        }, 2000);
      }
    } catch (err) {
      if (mountedRef.current) setState('error');
    }
  };

  const stopTouch = e => {
    e.stopPropagation();
  };

  return (
    <div className="pointer-events-none absolute bottom-[2px] right-0 left-0 z-10 flex items-center justify-center">
      {state === 'preloading' ? (
        <div className="pointer-events-none flex h-[16px] w-[86px] items-center overflow-hidden rounded-full bg-black/70">
          <div
            className="h-full bg-primary"
            style={{ width: `${percent}%`, transition: 'width 0.6s ease' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white">
            {percent}%
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          className={`flex h-[16px] items-center justify-center rounded-full px-[6px] text-[9px] font-semibold tracking-wide whitespace-nowrap ${
            state === 'done'
              ? 'bg-emerald-500/90 text-white'
              : state === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-black/70 text-white hover:bg-primary/90'
          }`}
          data-cy="series-preload-button"
          title={
            state === 'done'
              ? 'Preloaded — opens instantly'
              : state === 'error'
              ? 'Preload failed — tap to retry'
              : 'Preload this series (opens instantly after)'
          }
        >
          {state === 'done' ? '✓ READY' : state === 'error' ? '↻ RETRY' : '⚡ PRELOAD'}
        </button>
      )}
    </div>
  );
};

export { PreloadSeriesControl };
