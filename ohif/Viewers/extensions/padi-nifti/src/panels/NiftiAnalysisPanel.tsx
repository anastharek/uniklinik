import React from 'react';
import { Icons } from '@ohif/ui-next';
import { useNiftiStore } from '../stores/niftiStore';
import {
  COLORMAPS,
  PRESETS,
  colormapLabel,
  ADC_EXAMPLE_THRESHOLD,
  ADC_RANGE_PRESETS,
} from '../utils/adc';

/**
 * NIfTI Analysis right panel — the research control surface.
 * Visible whenever a NIfTI research session is active (layout DICOM + NIfTI).
 * ADC Mapping is the first analysis module.
 */

const NiftiAnalysisIcon = props => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="1.5"
      y="1.5"
      width="19"
      height="19"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <text
      x="11"
      y="15.5"
      textAnchor="middle"
      fontSize="9"
      fontWeight="bold"
      fill="currentColor"
      fontFamily="Arial, Helvetica, sans-serif"
    >
      N
    </text>
  </svg>
);

Icons.addIcon('padi-nifti', NiftiAnalysisIcon);

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-medium text-white/70">{label}</div>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4 border-b border-white/10 pb-4">
      <div className="mb-2 text-sm font-semibold text-white">{title}</div>
      {children}
    </div>
  );
}

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return Number(v).toFixed(2);
}

function NiftiAnalysisPanel({ commandsManager, servicesManager }) {
  const {
    status,
    stage,
    percent,
    error,
    metadata,
    adc,
    geometry,
    syncActive,
    settings,
    roi,
    seriesDescription,
  } = useNiftiStore();
  const roiArmed = useNiftiStore(st => st.roiArmed);
  const active = status !== 'idle';

  if (!active) {
    return (
      <div className="flex h-full flex-col p-3">
        <div className="mb-3 text-sm font-semibold text-white">NIfTI Analysis</div>
        <div className="text-xs text-white/60">
          Open the Layout selector → <b>DICOM + NIfTI</b> to start a research session.
        </div>
      </div>
    );
  }

  const sourceDesc =
    (metadata && metadata.source && metadata.source.seriesDescription) || '—';
  const sourceModality = (metadata && metadata.source && metadata.source.modality) || '—';

  const statusLabel =
    status === 'ready' || status === 'analysis'
      ? 'Ready'
      : status === 'saving'
        ? 'Saving…'
        : status === 'error'
          ? 'Error'
          : stage || 'Preparing…';

  const canQuantify = adc.validated;

  const updateRange = (i, patch) => {
    const ranges = settings.ranges.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    useNiftiStore.getState().setSettings({ ranges });
  };
  const removeRange = i => {
    useNiftiStore
      .getState()
      .setSettings({ ranges: settings.ranges.filter((_, idx) => idx !== i) });
  };
  const addRange = () => {
    useNiftiStore.getState().setSettings({
      ranges: [
        ...settings.ranges,
        { label: `Range ${settings.ranges.length + 1}`, min: 0, max: 1000, color: '#ffcc00' },
      ],
    });
  };

  return (
    <div
      className="flex h-full flex-col overflow-y-auto p-3"
      style={{ colorScheme: 'dark' }}
    >
      <div className="mb-3 text-sm font-semibold text-white">NIfTI Analysis</div>

      <Section title="Source Series">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Series</span>
          <span className="max-w-[60%] truncate text-white">{sourceDesc}</span>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Modality</span>
          <span className="text-white">{sourceModality}</span>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">NIfTI Status</span>
          <span className={status === 'error' ? 'text-red-400' : 'text-emerald-400'}>{statusLabel}</span>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Geometry</span>
          <span className={geometry.validated ? 'text-emerald-400' : 'text-amber-400'}>
            {geometry.validated ? 'Validated' : 'Warning'}
          </span>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Quantitative Scaling</span>
          <span className={canQuantify ? 'text-emerald-400' : 'text-amber-400'}>
            {canQuantify ? 'Validated' : 'Not validated'}
          </span>
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Slice Sync</span>
          <span className={syncActive ? 'text-emerald-400' : 'text-white/50'}>
            {syncActive ? 'Active' : 'Off'}
          </span>
        </div>
        {percent !== null && percent !== undefined && status !== 'ready' && status !== 'analysis' && (
          <div className="mt-1 text-xs text-white/60">
            {percent}%{roi && false ? '' : ''}
          </div>
        )}
        {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
      </Section>

      {status === 'error' && (
        <button
          className="mb-4 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          onClick={() => useNiftiStore.getState().start()}
        >
          Retry conversion
        </button>
      )}

      {(status === 'ready' || status === 'analysis' || status === 'saving') && (
        <>
          <Section title="ADC Mapping">
            {status !== 'analysis' && (
              <button
                className="mb-2 w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                onClick={() => useNiftiStore.getState().markAnalysisActive()}
              >
                Activate ADC Mapping
              </button>
            )}
            {status === 'analysis' && (
              <div className="mb-2 rounded bg-emerald-600/20 px-2 py-1 text-[11px] font-medium text-emerald-300">
                ADC Mapping active
              </div>
            )}
            <div className="mb-2 rounded bg-white/5 p-2 text-xs">
              {canQuantify ? (
                <span className="text-emerald-400">✓ ADC Scaling: Validated</span>
              ) : (
                <span className="text-amber-400">ADC Scaling: Not validated</span>
              )}
              {adc.units && <div className="mt-1 text-white/70">Units: {adc.units}</div>}
              {!canQuantify && adc.reason && (
                <div className="mt-1 text-white/60">Viewing allowed — quantitative analysis disabled. {adc.reason}</div>
              )}
              {canQuantify && adc.evidence && (
                <div className="mt-1 max-h-20 overflow-y-auto text-[10px] text-white/50">
                  {adc.evidence.join(' · ')}
                </div>
              )}
            </div>

            <Field label="ADC preset">
              <select
                className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                value={settings.preset}
                onChange={e => {
                  const preset = PRESETS.find(p => p.id === e.target.value);
                  if (!preset) return;
                  if (preset.requiresValidation && !canQuantify) {
                    useNiftiStore.getState().setSettings({ preset: preset.id, colormap: 'gray' });
                    return;
                  }
                  useNiftiStore.getState().setSettings({
                    preset: preset.id,
                    colormap: preset.colormap || settings.colormap,
                    wl: preset.wl !== null && preset.wl !== undefined ? preset.wl : settings.wl,
                    ww: preset.ww !== null && preset.ww !== undefined ? preset.ww : settings.ww,
                  });
                }}
              >
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.requiresValidation && !canQuantify ? ' (disabled — scaling)' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Colormap">
              <select
                className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                value={settings.colormap}
                onChange={e => useNiftiStore.getState().setSettings({ colormap: e.target.value })}
              >
                {COLORMAPS.map(c => (
                  <option key={c} value={c}>
                    {colormapLabel(c)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <Field label={canQuantify ? `Window Center (${adc.units || ''})` : 'Window Center'}>
                <input
                  type="number"
                  className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                  value={settings.wl === null ? '' : settings.wl}
                  placeholder="auto"
                  onChange={e =>
                    useNiftiStore.getState().setSettings({ wl: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Window Width">
                <input
                  type="number"
                  className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                  value={settings.ww === null ? '' : settings.ww}
                  placeholder="auto"
                  onChange={e =>
                    useNiftiStore.getState().setSettings({ ww: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <Field label={canQuantify ? `ADC Range Min (${adc.units || ''})` : 'ADC Range Min (display only)'}>
              <input
                type="number"
                className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                value={settings.rangeMin}
                onChange={e => useNiftiStore.getState().setSettings({ rangeMin: Number(e.target.value) })}
              />
            </Field>
            <Field label="ADC Range Max">
              <input
                type="number"
                className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                value={settings.rangeMax}
                onChange={e => useNiftiStore.getState().setSettings({ rangeMax: Number(e.target.value) })}
              />
            </Field>

            <Field label={`Colormap Opacity — ${settings.colormapOpacity}%`}>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full"
                value={settings.colormapOpacity}
                onChange={e => useNiftiStore.getState().setSettings({ colormapOpacity: Number(e.target.value) })}
              />
            </Field>

            <div className="mb-3">
              <label className="mb-1 flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={settings.thresholdEnabled}
                  disabled={!canQuantify}
                  onChange={e => useNiftiStore.getState().setSettings({ thresholdEnabled: e.target.checked })}
                />
                Show voxels below threshold
              </label>
              {!canQuantify && <div className="text-[10px] text-amber-400">Threshold requires validated ADC scaling.</div>}
            </div>
            {settings.thresholdEnabled && canQuantify && (
              <>
                <Field label={`Threshold Value (${adc.units || ''}) — research / user-defined`}>
                  <input
                    type="number"
                    className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
                    value={settings.thresholdValue === null ? '' : settings.thresholdValue}
                    placeholder={`e.g. ${ADC_EXAMPLE_THRESHOLD}`}
                    onChange={e =>
                      useNiftiStore.getState().setSettings({
                        thresholdValue: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label={`Overlay Opacity — ${settings.thresholdOpacity}%`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full"
                    value={settings.thresholdOpacity}
                    onChange={e => useNiftiStore.getState().setSettings({ thresholdOpacity: Number(e.target.value) })}
                  />
                </Field>
              </>
            )}

            <div className="mt-3 rounded border border-white/10 p-2">
              <label className="mb-1 flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={settings.rangeColorizeEnabled}
                  disabled={!canQuantify}
                  onChange={e => useNiftiStore.getState().setSettings({ rangeColorizeEnabled: e.target.checked })}
                />
                Colorize by ADC value ranges
              </label>
              {!canQuantify && (
                <div className="text-[10px] text-amber-400">Requires validated ADC scaling.</div>
              )}
              {settings.rangeColorizeEnabled && canQuantify && (
                <>
                  <button
                    className="mb-2 w-full rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                    onClick={() =>
                      useNiftiStore
                        .getState()
                        .setSettings({ ranges: ADC_RANGE_PRESETS.map(r => ({ ...r })) })
                    }
                  >
                    Load clinical presets (infarct core / penumbra / normal)
                  </button>
                  {settings.ranges.map((r, i) => (
                    <div key={i} className="mb-1 flex items-center gap-1 text-[11px]">
                      <input
                        type="color"
                        value={r.color}
                        className="h-6 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        onChange={e => updateRange(i, { color: e.target.value })}
                      />
                      <input
                        className="w-20 rounded border border-white/20 bg-black px-1 py-0.5 text-white"
                        value={r.label}
                        onChange={e => updateRange(i, { label: e.target.value })}
                      />
                      <input
                        type="number"
                        className="w-14 rounded border border-white/20 bg-black px-1 py-0.5 text-white"
                        placeholder="min"
                        value={r.min === null || r.min === undefined ? '' : r.min}
                        onChange={e => updateRange(i, { min: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                      <span className="text-white/50">–</span>
                      <input
                        type="number"
                        className="w-14 rounded border border-white/20 bg-black px-1 py-0.5 text-white"
                        placeholder="max"
                        value={r.max === null || r.max === undefined ? '' : r.max}
                        onChange={e => updateRange(i, { max: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                      <button
                        className="shrink-0 text-white/40 hover:text-red-400"
                        onClick={() => removeRange(i)}
                        title="Remove range"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="mt-1 w-full rounded border border-dashed border-white/20 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10"
                    onClick={addRange}
                  >
                    + Add range
                  </button>
                  <div className="mt-1 text-[10px] text-white/50">
                    Values outside every range render black · ranges are [min, max)
                  </div>
                </>
              )}
            </div>
          </Section>

          <Section title="ROI">
            <div className="mb-2 flex gap-2">
              <button
                className={`flex-1 rounded px-2 py-1.5 text-xs ${roi.type === 'ellipse' && roiArmed ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70'}`}
                onClick={() => {
                  useNiftiStore.getState().setRoi({ type: 'ellipse', points: null, results: null });
                  useNiftiStore.getState().setRoiArmed(true);
                }}
                disabled={!canQuantify}
              >
                Circle / Ellipse
              </button>
              <button
                className={`flex-1 rounded px-2 py-1.5 text-xs ${roi.type === 'freehand' && roiArmed ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70'}`}
                onClick={() => {
                  useNiftiStore.getState().setRoi({ type: 'freehand', points: null, results: null });
                  useNiftiStore.getState().setRoiArmed(true);
                }}
                disabled={!canQuantify}
              >
                Freehand
              </button>
              <button
                className={`flex-1 rounded px-2 py-1.5 text-xs ${!roiArmed ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'}`}
                onClick={() => useNiftiStore.getState().setRoiArmed(false)}
              >
                View
              </button>
            </div>
            {!canQuantify && (
              <div className="text-[10px] text-amber-400">ROI measurement requires validated ADC scaling.</div>
            )}
            {canQuantify && roi.results && (
              <div className="mt-2 rounded bg-white/5 p-2 text-xs text-white">
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60">Mean ADC</span>
                  <span className="font-mono">{fmt(roi.results.mean)}</span>
                </div>
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60">Median ADC</span>
                  <span className="font-mono">{fmt(roi.results.median)}</span>
                </div>
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60">Minimum ADC</span>
                  <span className="font-mono">{fmt(roi.results.min)}</span>
                </div>
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60">Maximum ADC</span>
                  <span className="font-mono">{fmt(roi.results.max)}</span>
                </div>
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60">Standard deviation</span>
                  <span className="font-mono">{fmt(roi.results.std)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ROI area</span>
                  <span className="font-mono">
                    {roi.results.area !== null ? `${roi.results.area.toFixed(2)} mm²` : '—'}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-white/50">
                  {roi.results.count} voxels · units: {adc.units || 'native'}
                </div>
              </div>
            )}
          </Section>

          <div className="mb-3 flex gap-2">
            <button
              className="flex-1 rounded border border-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
              onClick={() => useNiftiStore.getState().resetAnalysis()}
            >
              Reset Analysis
            </button>
            <button
              className="flex-1 rounded bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500"
              onClick={() => useNiftiStore.getState().requestSaveDerived()}
            >
              Save as DICOM
            </button>
          </div>

          <Field label="Series Description (editable before save)">
            <input
              className="w-full rounded border border-white/20 bg-black px-2 py-1.5 text-xs text-white"
              defaultValue={seriesDescription || 'ADC Parametric Map – Research'}
              onChange={e => useNiftiStore.getState().setSeriesDescription(e.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  );
}

export default NiftiAnalysisPanel;
