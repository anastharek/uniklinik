import React, { useState } from 'react';
import { Input, FooterAction } from '@ohif/ui-next';

const norm = s => String(s || '').trim().toUpperCase();

/**
 * In-app name prompt for Capture Image. Replaces window.prompt, which is
 * silently ignored on iOS Safari (returns null) — that made Capture appear to
 * do nothing on iPhones (no dialog, no notification, no save).
 * Rendered through uiModalService (receives `hide` to close the modal).
 */
export default function CaptureNameModal({ hide, onSave }) {
  const [text, setText] = useState('');
  const canSave = text.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave(norm(text));
    hide();
  };

  return (
    <div className="text-foreground text-[13px]">
      <p>
        Enter a name for the captured series. It will be saved in this study and
        shown at the <span className="text-white">top of the series list</span>.
      </p>
      <Input
        autoFocus
        className="mt-3 text-white uppercase placeholder:text-white/40"
        placeholder="E.G. BLEED MARKUP"
        value={text}
        onChange={e => setText(e.target.value.toUpperCase())}
        onKeyDown={e => {
          if (e.key === 'Enter') save();
        }}
      />
      <FooterAction className="mt-4">
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
          <FooterAction.Primary disabled={!canSave} onClick={save}>
            Save
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}
