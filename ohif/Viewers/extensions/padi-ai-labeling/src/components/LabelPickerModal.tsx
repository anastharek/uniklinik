import React, { useEffect, useState } from 'react';
import { Button, Input, Modal } from '@ohif/ui-next';
import { labelColor, dotStyle } from '../utils/labelColor';

/** Normalize label names: uppercase only. */
const norm = s => String(s || '').trim().toUpperCase();

/**
 * Label prompt shown immediately after a rectangle is drawn:
 * free-text input + clickable chips of labels already used in this study.
 */
export default function LabelPickerModal({ isOpen, existingLabels = [], onCancel, onSave }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) setText('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave = text.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Enter label"
      shouldCloseOnOverlayClick={false}
    >
      <div className="flex flex-col gap-3 py-2">
        <Input
          autoFocus
          className="text-white uppercase placeholder:text-white/40"
          placeholder="TYPE A LABEL, E.G. HEMORRHAGE"
          value={text}
          onChange={e => setText(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter' && canSave) onSave(norm(text));
          }}
        />

        {existingLabels.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[11px] uppercase tracking-wide text-white/60">
              Previous labels
            </div>
            <div className="flex flex-wrap gap-1">
              {existingLabels.map(l => {
                const name = norm(l.name);
                const color = labelColor(name);
                return (
                  <button
                    key={l.class_id}
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-white/30 px-2 py-0.5 text-xs text-white uppercase hover:bg-white/10"
                    onClick={() => {
                      setText(name);
                      onSave(name);
                    }}
                  >
                    <span style={dotStyle(color)} />
                    {name} ({l.count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={() => onSave(norm(text))}>
            Save label
          </Button>
        </div>
      </div>
    </Modal>
  );
}
