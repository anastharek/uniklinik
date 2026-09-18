import React, { useState } from 'react';
import { FooterAction } from '@ohif/ui-next';

const SWATCHES = [
  { name: 'Yellow', value: 'rgb(255, 255, 0)' },
  { name: 'Red', value: 'rgb(255, 77, 77)' },
  { name: 'Green', value: 'rgb(0, 255, 0)' },
  { name: 'Cyan', value: 'rgb(0, 229, 255)' },
  { name: 'Blue', value: 'rgb(64, 128, 255)' },
  { name: 'Orange', value: 'rgb(255, 153, 51)' },
  { name: 'Magenta', value: 'rgb(255, 0, 255)' },
  { name: 'Lime', value: 'rgb(128, 255, 0)' },
  { name: 'White', value: 'rgb(255, 255, 255)' },
];

/**
 * Color + line-width picker for annotations (arrows, rectangles, ellipses…).
 * Rendered through uiModalService; on Apply it calls back with
 * { color, lineWidth } — the command module applies it to new annotations
 * (default style) AND existing ones in the current study.
 */
export default function AnnotationStyleModal({ hide, initialColor, initialWidth, onApply }) {
  const [color, setColor] = useState(initialColor || SWATCHES[0].value);
  const [width, setWidth] = useState(initialWidth || 3);

  const apply = () => {
    onApply({ color, lineWidth: width });
    hide();
  };

  return (
    <div className="text-foreground text-[13px]">
      <p className="mb-3">
        Pick the color and thickness for annotations (arrow, rectangle, ellipse…).
        Applies to new annotations and to existing ones in this study. Thick
        lines work as a highlighter.
      </p>
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map(s => (
          <button
            key={s.name}
            type="button"
            title={s.name}
            onClick={() => setColor(s.value)}
            className={`h-7 w-7 rounded-full border-2 ${
              color === s.value ? 'border-white' : 'border-white/25'
            }`}
            style={{ background: s.value }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="shrink-0 text-white/70">Thickness</span>
        <input
          type="range"
          min={1}
          max={12}
          value={width}
          onChange={e => setWidth(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-6 shrink-0 text-right text-white">{width}</span>
      </div>
      <FooterAction className="mt-4">
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
          <FooterAction.Primary onClick={apply}>Apply</FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}
