import React, { useEffect, useRef, useState } from 'react';
import { useSystem } from '@ohif/core';

/**
 * Per-series preload control for the OHIF study browser (PUTRACNS).
 *
 * Two-stage warm-up:
 *  Stage 1 (server): POST /api/preload/series/:seriesUid warms the series'
 *  frames in the Orthanc-side caches; we poll until done and show %.
 *  Stage 2 (client): once the server is warm, the frames are downloaded into
 *  the browser's cornerstone cache (warmDisplaySetCache command) so scrolling
 *  the series is instant even on a slow external link. Frames already cached
 *  resolve instantly, so re-warming is cheap.
 *
 * The server stage persists to localStorage (✓ survives reloads). The client
 * cache is session-only, so when a previously-preloaded series becomes the
 * active viewport we automatically re-warm it.
 */
const LS_PREFIX = 'putracns_preload_series_';

const PreloadSeriesControl = ({
  SeriesInstanceUID,
  commandsManager: commandsManagerProp,
  isActive = false,
}: {
  SeriesInstanceUID?: string;
  commandsManager?: any;
  isActive?: boolean;
}): React.ReactNode => {
  const { commandsManager } = useSystem();
  const cm = commandsManagerProp || commandsManager;

  const [state, setState] = useState<'idle' | 'preloading' | 'done' | 'error'>(() =>
    SeriesInstanceUID && localStorage.getItem(LS_PREFIX + SeriesInstanceUID) === 'done' ? 'done' : 'idle'
  );
  const [percent, setPercent] = useState(0);
  const [warm, setWarm] = useState<{ loaded: number; total: number } | null>(null);
  const [warmDone, setWarmDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const warmStartedRef = useRef(false);

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

  const startWarm = async () => {
    if (!SeriesInstanceUID || !cm || warmStartedRef.current) return;
    warmStartedRef.current = true;
    if (mountedRef.current) {
      setWarm({ loaded: 0, total: 0 });
      setWarmDone(false);
    }
    try {
      await cm.runCommand('warmDisplaySetCache', {
        seriesInstanceUID: SeriesInstanceUID,
        onProgress: (loaded: number, total: number) => {
          if (mountedRef.current) setWarm({ loaded, total });
        },
      });
      if (mountedRef.current) setWarmDone(true);
    } catch (e) {
      /* best-effort — server preload is the important part */
    } finally {
      if (mountedRef.current) setWarm(null);
    }
  };

  // Auto re-warm when a previously preloaded series becomes the active viewport
  // (the browser cache is session-only, so after a reload it must be re-filled).
  useEffect(() => {
    if (isActive && state === 'done' && !warmStartedRef.current) {
      startWarm();
    }
  }, [isActive, state]);

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
      // Server warm done -> now warm the browser cache.
      startWarm();
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

  const warmActive = warm && warm.total > 0;
  const warmPercent = warmActive
    ? Math.min(100, Math.round(((warm.loaded || 0) / warm.total) * 100))
    : 0;

  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex items-center justify-center">
      {state === 'preloading' || (state === 'done' && warmActive) ? (
        <div className="pointer-events-none flex h-[22px] w-[100px] items-center overflow-hidden rounded-full bg-black/60 shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          <div
            className="h-full bg-white"
            style={{ width: `${state === 'preloading' ? percent : warmPercent}%`, transition: 'width 0.6s ease' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
            {state === 'preloading' ? `${percent}%` : `📥 ${warmPercent}%`}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          className={`pointer-events-auto flex h-[22px] cursor-pointer items-center justify-center rounded-full px-[10px] text-[11px] font-bold tracking-wide whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.7)] ${
            state === 'done'
              ? 'bg-emerald-500 text-white'
              : state === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-white text-black hover:bg-white/85'
          }`}
          data-cy="series-preload-button"
          title={
            state === 'done'
              ? warmDone
                ? 'Server + phone cache ready — instant scroll'
                : 'Server preloaded — phone cache warming…'
              : state === 'error'
              ? 'Preload failed — tap to retry'
              : 'Preload this series (server + phone cache)'
          }
        >
          {state === 'done' ? (warmDone ? '✓ READY' : warm ? '📥 WARM…' : '✓ READY') : state === 'error' ? '↻ RETRY' : '⚡ PRELOAD'}
        </button>
      )}
    </div>
  );
};

export { PreloadSeriesControl };
