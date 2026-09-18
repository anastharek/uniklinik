import React, { useState } from 'react';
import { Input, FooterAction } from '@ohif/ui-next';

/**
 * In-app dialogs for the Overlay/Fusion panel (replaces window.prompt —
 * ignored on iOS Safari). Rendered through uiModalService (receives `hide`).
 */

/** Name prompt for "Save Fusion" (new series) and "Save as template". */
export function FusionNameModal({
  hide,
  onSave,
  purpose = 'series', // 'series' | 'template'
  defaultName = '',
}) {
  const [text, setText] = useState(defaultName || '');
  const canSave = text.trim().length > 0;

  const save = () => {
    if (!canSave) {
      return;
    }
    onSave(text.trim());
    hide();
  };

  return (
    <div className="text-foreground text-[13px]">
      <p>
        {purpose === 'series' ? (
          <>
            Enter the name of the new <span className="text-white">series</span>. It will be
            saved in this study (top of the series list) with every slice, e.g.{' '}
            <span className="text-white">sb1000-swi mip fusion</span>. Colors, opacity and
            windowing are baked in.
          </>
        ) : (
          <>
            Enter a name for this <span className="text-white">template</span>. The current
            base/overlay series + their color, opacity, window and slice settings are saved.
            Templates are shared — <span className="text-white">everyone</span> who opens this
            viewer sees them, and they can be re-applied to any study whose series match.
          </>
        )}
      </p>
      <Input
        autoFocus
        className="mt-3 text-white placeholder:text-white/40"
        placeholder={purpose === 'series' ? 'E.G. SB1000-SWI MIP FUSION' : 'E.G. DWI + ADC PROTOCOL'}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            save();
          }
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

/** Password gate for deleting a template (same password as label export). */
export function FusionPasswordModal({ hide, onConfirm, templateName }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const busyRef = React.useRef(false);

  const confirm = async () => {
    if (!text.trim() || busyRef.current) {
      return;
    }
    busyRef.current = true;
    try {
      await onConfirm(text.trim());
      hide();
    } catch (e) {
      setError((e && e.message) || 'Wrong password');
      busyRef.current = false;
    }
  };

  return (
    <div className="text-foreground text-[13px]">
      <p>
        Deleting template <span className="text-white">“{templateName}”</span> removes it for
        everyone. Enter the export password to confirm.
      </p>
      <Input
        autoFocus
        type="password"
        className="mt-3 text-white placeholder:text-white/40"
        placeholder="Export password"
        value={text}
        onChange={e => {
          setText(e.target.value);
          setError('');
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            confirm();
          }
        }}
      />
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
      <FooterAction className="mt-4">
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
          <FooterAction.Primary disabled={!text.trim()} onClick={confirm}>
            Delete
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}
