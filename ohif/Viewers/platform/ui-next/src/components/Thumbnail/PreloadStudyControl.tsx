import React, { useEffect, useRef, useState } from 'react';
import { useSystem } from '@ohif/core';

/**
 * Per-study preload control for the OHIF study browser (PUTRACNS).
 *
 * Sits below each study header (above that study's series thumbnails) and
 * preloads ALL series belonging to THIS StudyInstanceUID only — never other
 * studies of the same patient.
 *
 * Stage 1 (server): POST /api/preload/:studyId (accepts the DICOM
 * StudyInstanceUID; the backend resolves it to the Orthanc internal ID). The
 * server-side job warms every series (Osimis + OHIF JPEG-LS paths), and this
 * control polls GET until done showing "Loading X / Y series".
 * Stage 2 (client): once the server is warm, the frames are downloaded into
 * the browser's cornerstone cache (warmDisplaySetCache command) so opening
 * and scrolling any series of the study is instant.
 *
 * Server state persists to localStorage (✓ survives reloads). The browser
 * cache is session-only; the per-series controls re-warm the active series
 * automatically on later visits.
 */
const LS_PREFIX = 'putracns_preload_study_';

const PreloadStudyControl = ({
  StudyInstanceUID,
  commandsManager: commandsManagerProp,
}: {
  StudyInstanceUID?: string;
  commandsManager?: any;
}): React.ReactNode => {
  const { commandsManager } = useSystem();
  const cm = commandsManagerProp || commandsManager;

  const [state, setState] = useState<'idle' | 'preloading' | 'done' | 'error'>(() =>
    StudyInstanceUID && localStorage.getItem(LS_PREFIX + StudyInstanceUID) === 'done' ? 'done' : 'idle'
  );
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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
    if (!StudyInstanceUID || !cm || warmStartedRef.current) return;
    warmStartedRef.current = true;
    if (mountedRef.current) {
      setWarm({ loaded: 0, total: 0 });
      setWarmDone(false);
    }
    try {
      await cm.runCommand('warmDisplaySetCache', {
        studyInstanceUID: StudyInstanceUID,
        onProgress: (loaded: number, total: number) => {
          if (mountedRef.current) setWarm({ loaded, total });
        },
      });
      if (mountedRef.current) setWarmDone(true);
    } catch (e) {
      /* best-effort */
    } finally {
      if (mountedRef.current) setWarm(null);
    }
  };

  if (!StudyInstanceUID) {
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
    if (!data || typeof data !== 'object') return;
    if (data.status === 'done' || data.fromCache) {
      stopPolling();
      setState('done');
      setProgress(null);
      try {
        localStorage.setItem(LS_PREFIX + StudyInstanceUID, 'done');
      } catch (e) {
        /* ignore */
      }
      // Server warm done -> now warm the browser cache for the whole study.
      startWarm();
    } else if (data.status === 'error') {
      stopPolling();
      setState('error');
    } else if (data.status === 'none') {
      // Job record gone (e.g. app restart) — frames may still be warm.
      stopPolling();
      setState('idle');
      setProgress(null);
    } else if (typeof data.doneSeries === 'number' && typeof data.totalSeries === 'number') {
      setProgress({ done: data.doneSeries, total: data.totalSeries });
    }
  };

  const start = async e => {
    e.stopPropagation();
    e.preventDefault();
    if (state === 'preloading' || state === 'done') return;
    setState('preloading');
    setProgress(null);
    const uid = encodeURIComponent(StudyInstanceUID);
    try {
      const res = await fetch(`/api/preload/${uid}`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      apply(data);
      if (data && (data.status === 'queued' || data.status === 'running')) {
        timerRef.current = setInterval(async () => {
          try {
            const r = await fetch(`/api/preload/${uid}`, {
              credentials: 'include',
              cache: 'no-store',
            });
            const d = await r.json();
            apply(d);
            if (d && (d.status === 'done' || d.status === 'error' || d.status === 'none')) {
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

  const label = (() => {
    if (state === 'preloading') {
      if (progress && progress.total > 0) {
        return `⏳ LOADING ${Math.min(progress.done, progress.total)} / ${progress.total} SERIES`;
      }
      return '⏳ PRELOADING…';
    }
    if (state === 'done' && warmActive) return `📥 WARMING PHONE CACHE ${warmPercent}%`;
    if (state === 'done') return '✓ ALL SERIES READY';
    if (state === 'error') return '↻ RETRY';
    return '⚡ PRELOAD ALL SERIES';
  })();

  return (
    <div
      className="flex w-full items-center justify-center px-[8px] pb-[2px]"
      onTouchStart={stopTouch}
      onTouchEnd={stopTouch}
    >
      <button
        type="button"
        onClick={start}
        className={`flex h-[34px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-full text-[12px] font-bold tracking-wide whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.7)] ${
          state === 'done'
            ? 'bg-emerald-500 text-white'
            : state === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-white text-black hover:bg-white/85'
        }`}
        data-cy="study-preload-button"
        title={
          state === 'done'
            ? warmDone
              ? 'All series preloaded (server + phone cache) — instant'
              : 'Server preloaded — phone cache warming…'
            : state === 'error'
            ? 'Preload failed — tap to retry'
            : 'Preload all series of this study (only this StudyInstanceUID)'
        }
      >
        {label}
      </button>
    </div>
  );
};

export { PreloadStudyControl };
