import React, { useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import styles from './ImageScrollbar.module.css';

export interface ImageScrollbarProps {
  value: number;
  max: number;
  height: string;
  onChange: (value: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ImageScrollbar: React.FC<ImageScrollbarProps> = ({
  value,
  max,
  height,
  onChange,
  onContextMenu = e => e.preventDefault(),
  className = '',
}) => {
  if (max === 0) {
    return null;
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);

  const style = {
    width: height, // This is intentional for the rotation
  };

  // Mobile-only visual handle: an absolutely positioned div that mirrors the
  // input value. The range input itself stays as the (invisible) drag surface
  // with a generous touch zone; a plain div is engine-independent, so the
  // handle renders in exactly the same spot on Safari, Chrome and Firefox.
  const pct = max > 0 ? value / max : 0;
  const handleStyle = {
    top: `calc(${(pct * 100).toFixed(3)}% - ${(64 * pct).toFixed(2)}px)`,
  };

  // ---- Pointer-driven scrubbing -------------------------------------------
  // The rotated native <input type=range> does not track finger drags
  // reliably on mobile browsers (especially iOS Safari), so we drive the
  // slice value ourselves from raw pointer coordinates. This works
  // identically on every engine. Taps still jump to the tapped position;
  // grabbing the handle keeps the grab offset so it follows the finger.
  const valueFromY = useCallback(
    (clientY: number, grabOffset: number): number => {
      const input = inputRef.current;
      if (!input) return value;
      const rect = input.getBoundingClientRect();
      if (!rect.height) return value;
      const frac = (clientY - rect.top - grabOffset) / rect.height;
      return Math.max(0, Math.min(max, Math.round(frac * max)));
    },
    [max, value]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input) return;
      event.preventDefault();
      draggingRef.current = true;
      const rect = input.getBoundingClientRect();
      const thumbCenter = rect.top + (max ? (value / max) * rect.height : 0);
      const grab = event.clientY - thumbCenter;
      // Finger on/near the thumb => stick to it; anywhere else => scrub to finger.
      input.dataset.grab = (Math.abs(grab) > 24 ? 0 : grab).toString();
      try {
        input.setPointerCapture(event.pointerId);
      } catch (_) {
        /* noop */
      }
      const next = valueFromY(event.clientY, parseFloat(input.dataset.grab));
      onChange(next);
    },
    [max, value, valueFromY, onChange]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input || !draggingRef.current) return;
      const grab = parseFloat(input.dataset.grab || '0');
      onChange(valueFromY(event.clientY, grab));
    },
    [valueFromY, onChange]
  );

  const stopDragging = useCallback((event: React.PointerEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;
    draggingRef.current = false;
    try {
      input.releasePointerCapture(event.pointerId);
    } catch (_) {
      /* noop */
    }
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const intValue = parseInt(event.target.value, 10);
      onChange(intValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // We don't allow direct keyboard navigation (arrow keys)
    const keys = {
      DOWN: 40,
      UP: 38,
    };

    if (event.which === keys.DOWN || event.which === keys.UP) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      className={cn(styles.scrollbarContainer, className)}
      onContextMenu={onContextMenu}
    >
      <div className={styles.scrollbarInner}>
        <input
          ref={inputRef}
          className={cn(styles.scrollbarInput, 'mousetrap imageSlider')}
          style={style}
          type="range"
          min="0"
          max={max}
          step="1"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          aria-label="Image navigation scrollbar"
          data-testid="image-scrollbar-input"
        />
        <div className={styles.mobileHandle} style={handleStyle} aria-hidden="true" />
      </div>
    </div>
  );
};
