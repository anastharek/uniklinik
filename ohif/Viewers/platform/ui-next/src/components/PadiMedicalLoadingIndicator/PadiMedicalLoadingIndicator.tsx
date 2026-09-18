import React from 'react';
import classNames from 'classnames';

import ProgressLoadingBar from '../ProgressLoadingBar';
import { Icons } from '../Icons';

const RING_RADIUS = 42;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

/**
 * PadiMedical-branded loading screen for the OHIF viewer (study open).
 *
 * Shows the PadiMedical logo, a circular progress ring with a real percentage
 * (derived from actual viewer initialization tasks — never a fake timer), a
 * linear progress bar, and a short stage label ("Loading study metadata…",
 * "Preparing series…", etc).
 *
 * Props:
 *  - progress: number 0..100, or null/undefined → indeterminate (spinner)
 *  - stageText: short status string shown under the bar (e.g. "Loading images 120 / 400")
 *  - error: if true, shows "Unable to load viewer" + Retry instead of progress
 *  - onRetry: callback for the Retry button (e.g. reload the viewer route)
 */
function PadiMedicalLoadingIndicator({
  className,
  progress,
  stageText,
  error,
  onRetry,
}: {
  className?: string;
  progress?: number | null;
  stageText?: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  const hasProgress = typeof progress === 'number' && isFinite(progress);
  const pct = hasProgress ? Math.max(0, Math.min(100, Math.round(progress))) : null;

  // Absolute asset URL — relative paths break on deep viewer routes
  // (e.g. /viewer-ohif/viewer/<study> would resolve to .../viewer/images/...).
  // PUBLIC_URL is baked at build time (/viewer-ohif/) by the Dockerfile.
  const publicUrl =
    typeof window !== 'undefined' && (window as any).PUBLIC_URL
      ? (window as any).PUBLIC_URL
      : '/';
  const logoUrl = `${publicUrl}images/padi-logo-transparent.png`;

  return (
    <div
      className={classNames(
        'absolute top-0 left-0 z-50 flex flex-col items-center justify-center gap-5 px-6',
        className
      )}
    >
      {/* PadiMedical logo — reused official asset (never modified) */}
      <img
        src={logoUrl}
        alt="PadiMedical"
        className="h-16 w-auto max-w-[70vw] object-contain"
        draggable={false}
      />

      {error ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-foreground text-base font-medium">Unable to load viewer</div>
          {stageText && (
            <div className="text-muted-foreground max-w-sm text-center text-sm">{stageText}</div>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-primary text-primary-foreground rounded-md px-6 py-2 text-sm font-medium hover:opacity-90"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-foreground text-base font-medium">Loading Viewer</div>

          {/* Circular progress ring (determinate) / spinning loader (indeterminate) */}
          <div className="relative h-24 w-24">
            {pct !== null ? (
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="8"
                  className="stroke-foreground opacity-10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={RING_CIRC * (1 - pct / 100)}
                />
              </svg>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icons.LoadingSpinner className="h-14 w-14 text-primary" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-foreground text-xl font-semibold tabular-nums">
                {pct !== null ? `${pct}%` : ''}
              </span>
            </div>
          </div>

          <div className="w-56 max-w-[70vw] sm:w-64">
            <ProgressLoadingBar progress={pct} />
          </div>
          {stageText && <div className="text-muted-foreground text-center text-sm">{stageText}</div>}
        </>
      )}
    </div>
  );
}

export default PadiMedicalLoadingIndicator;
