import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eventTarget, metaData, imageLoader, cache } from '@cornerstonejs/core';
import { Enums, annotation as csAnnotation } from '@cornerstonejs/tools';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';
import { Button, Icons } from '@ohif/ui-next';
import { api } from '../services/api';
import { parseImageId } from '../utils/imageId';
import { worldToPixelBBox } from '../utils/worldToPixel';
import { pixelToWorldBBox, cross3 } from '../utils/pixelToWorld';
import { labelColor, dotStyle } from '../utils/labelColor';
import LabelPickerModal from '../components/LabelPickerModal';

/** Normalize label names: uppercase only. */
const norm = s => String(s || '').trim().toUpperCase();

const DEMO_USER = 'demo';
const DEMO_PASS = 'demo123';

/**
 * Quick Label — minimal labeling flow (no login UI, no projects/cases UI):
 *   open study → draw rectangle → type/pick label → saved to list
 *   click list item → study loads + box shown on image
 *   Export → YOLO zip (images + labels + manifest)
 */
export default function AiLabelingPanel({ commandsManager, servicesManager }) {
  const [ready, setReady] = useState(false); // auto-login done
  const [authError, setAuthError] = useState(null);
  const [studyUID, setStudyUID] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // ── projects (Quick Label project mode) ──
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null); // {labelId, name}

  const [bboxActive, setBboxActive] = useState(false);
  const [pendingBBox, setPendingBBox] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);

  const addedAnnotationUIDs = useRef([]);

  const { viewportGridService, cornerstoneViewportService, toolGroupService } = servicesManager.services;

  // ── silent auto-login (demo account — no login UI) ──────────────────────
  useEffect(() => {
    api
      .login(DEMO_USER, DEMO_PASS)
      .then(() => setReady(true))
      .catch(() => {
        // maybe already logged in from a previous session
        api
          .me()
          .then(() => setReady(true))
          .catch(() => setAuthError('Labeling backend unreachable — is the server up?'));
      });
  }, []);

  // ── load project list after auto-login; keep the selected project ───────
  const loadProjects = useCallback(async () => {
    try {
      const d = await api.projects();
      const list = (d && d.projects) || [];
      setProjects(list);
      setSelectedProjectId(prev => {
        if (prev && list.some(p => p.id === prev)) return prev;
        return list.length ? list[0].id : null;
      });
    } catch (e) {
      console.warn('[AI Labeling] loadProjects error:', e);
    }
  }, []);

  useEffect(() => {
    if (ready) loadProjects();
  }, [ready, loadProjects]);

  // ── detect current study from the active viewport ───────────────────────
  const detectStudyUID = useCallback(() => {
    try {
      const state = viewportGridService.getState();
      const vp = cornerstoneViewportService.getCornerstoneViewport(state.activeViewportId);
      if (!vp) return null;
      const imageId = vp.getCurrentImageId();
      if (!imageId) return null;
      const parsed = parseImageId(imageId);
      return parsed ? parsed.studyInstanceUID : null;
    } catch {
      return null;
    }
  }, [viewportGridService, cornerstoneViewportService]);

  // poll: follow study changes in the viewport (2s), reload summary on change
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const uid = detectStudyUID();
      setStudyUID(prev => (prev !== uid ? uid : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, [ready, detectStudyUID]);

  useEffect(() => {
    if (!ready || !studyUID || !selectedProjectId) {
      setSummary(null);
      return;
    }
    api
      .studySummary(studyUID, selectedProjectId)
      .then(d => setSummary(d))
      .catch(() => setSummary(null));
  }, [ready, studyUID, selectedProjectId]);

  const refreshSummary = useCallback(() => {
    if (!studyUID || !selectedProjectId) return;
    api
      .studySummary(studyUID, selectedProjectId)
      .then(d => setSummary(d))
      .catch(e => setError(e.message));
  }, [studyUID, selectedProjectId]);

  // ── cornerstone: bbox completed → label prompt ──────────────────────────
  useEffect(() => {
    if (!ready) return;
    const handler = evt => {
      try {
        const annotation = evt.detail && evt.detail.annotation;
        if (!annotation || !annotation.data || !annotation.data.handles) return;
        // RectangleROI only (4 corner points)
        const pts = annotation.data.handles.points;
        if (!pts || pts.length !== 4) return;
        if (annotation.metadata && annotation.metadata.toolName !== 'RectangleROI') return;

        // Prefer the image the annotation was drawn on; fall back to the
        // active viewport's current image.
        let imageId = annotation.metadata && annotation.metadata.referencedImageId;
        if (!imageId) {
          const state = viewportGridService.getState();
          const vp = cornerstoneViewportService.getCornerstoneViewport(state.activeViewportId);
          if (!vp) return;
          imageId = vp.getCurrentImageId();
        }
        if (!imageId) return;
        console.log('[AI Labeling] bbox captured on', imageId);
        // Capture the study UID at draw time so a later viewport change can't
        // make the save silently no-op.
        const drawnStudyUID = detectStudyUID();

        // Capture the windowing the labeler is seeing right now — the export
        // re-renders with these values so the YOLO PNG matches the viewer.
        let windowWidth, windowCenter, invert;
        try {
          const vp = findViewportByImageId(imageId, cornerstoneViewportService);
          if (vp && typeof vp.getProperties === 'function') {
            const props = vp.getProperties();
            const voi = props && props.voiRange;
            if (voi && Number.isFinite(voi.lower) && Number.isFinite(voi.upper)) {
              windowWidth = voi.upper - voi.lower;
              windowCenter = voi.lower + (voi.upper - voi.lower) / 2;
            }
            invert = !!props.invert;
          }
        } catch (err) {
          console.warn('[AI Labeling] windowing capture error:', err);
        }
        setPendingBBox({ worldPoints: pts, imageId, studyUID: drawnStudyUID || studyUID, windowWidth, windowCenter, invert });
      } catch (err) {
        console.warn('[AI Labeling] bbox handler error:', err);
      }
    };
    eventTarget.addEventListener(Enums.Events.ANNOTATION_COMPLETED, handler);
    return () => eventTarget.removeEventListener(Enums.Events.ANNOTATION_COMPLETED, handler);
  }, [ready, viewportGridService, cornerstoneViewportService, studyUID, detectStudyUID]);

  // ── actions ─────────────────────────────────────────────────────────────
  const activateBBoxTool = () => {
    setBboxActive(true);
    try {
      // Use the exact command OHIF's own Rectangle toolbar button uses
      // (setToolActiveToolbar → setToolActive, handles the previous tool
      // and applies the primary mouse binding).
      commandsManager.runCommand('setToolActiveToolbar', { toolName: 'RectangleROI' });
      console.log('[AI Labeling] RectangleROI activated via toolbar command');

      // Fallback: direct activation on every tool group that has the tool
      // (covers tool groups the toolbar command may not have reached).
      let activated = false;
      const ids = toolGroupService.getToolGroupIds();
      ids.forEach(id => {
        const g = toolGroupService.getToolGroup(id);
        if (g && g.hasTool('RectangleROI')) {
          g.setToolActive('RectangleROI', { bindings: [{ mouseButton: 1 }] });
          activated = true;
        }
      });
      if (!activated) {
        const state = viewportGridService.getState();
        const g = toolGroupService.getToolGroupForViewport(state.activeViewportId);
        if (g && g.hasTool('RectangleROI')) {
          g.setToolActive('RectangleROI', { bindings: [{ mouseButton: 1 }] });
          activated = true;
        }
      }
      console.log('[AI Labeling] RectangleROI direct activation:', activated ? 'ok' : 'no group had it');
    } catch (err) {
      console.warn('[AI Labeling] activateBBoxTool error:', err);
    }
  };

  const deactivateBBoxTool = () => {
    setBboxActive(false);
    try {
      commandsManager.runCommand('setToolActiveToolbar', { toolName: 'WindowLevel' });
    } catch (err) {
      console.warn('[AI Labeling] deactivateBBoxTool error:', err);
    }
  };

  const saveBBox = async labelName => {
    if (!pendingBBox) return;
    if (!selectedProjectId) {
      console.warn('[AI Labeling] save aborted: no project selected');
      setError('No project selected — pick or create a project first');
      return;
    }
    const { worldPoints, imageId } = pendingBBox;
    const targetStudyUID = pendingBBox.studyUID || studyUID;
    if (!targetStudyUID) {
      console.warn('[AI Labeling] save aborted: no studyUID');
      setError('No study detected — open a study first');
      return;
    }

    // Pixel-space conversion: try the metadata path first, then fall back
    // to the viewport's own imageData (no metadata dependency — always works).
    let bbox = worldToPixelBBox(worldPoints, imageId);
    if (!bbox) {
      const vp = findViewportByImageId(imageId, cornerstoneViewportService);
      if (vp) bbox = worldToPixelBBoxFromViewport(worldPoints, vp);
    }

    setPendingBBox(null);
    deactivateBBoxTool();

    const parsed = parseImageId(imageId);
    if (!parsed || !bbox) {
      console.warn('[AI Labeling] save geometry failed:', { parsed, bbox, imageId });
      setError('Cannot read image geometry for this image — try another slice');
      return;
    }

    const payload = {
      seriesInstanceUID: parsed.seriesInstanceUID,
      sopInstanceUID: parsed.sopInstanceUID,
      frameNumber: parsed.frameNumber,
      labelName: norm(labelName),
      projectId: selectedProjectId,
      ...(Number.isFinite(Number(pendingBBox.windowWidth)) ? { windowWidth: pendingBBox.windowWidth } : {}),
      ...(Number.isFinite(Number(pendingBBox.windowCenter)) ? { windowCenter: pendingBBox.windowCenter } : {}),
      ...(pendingBBox.invert ? { invert: true } : {}),
      ...bbox,
    };
    try {
      await api.createStudyAnnotation(targetStudyUID, payload);
      refreshSummary();
    } catch (e) {
      // 401 = session expired → silent re-login and retry once
      if (e.status === 401) {
        try {
          await api.login(DEMO_USER, DEMO_PASS);
          await api.createStudyAnnotation(targetStudyUID, payload);
          refreshSummary();
          return;
        } catch (e2) {
          setError(e2.message);
          return;
        }
      }
      console.warn('[AI Labeling] save error:', e);
      setError(e.message);
    }
  };

  // ── click list item → load study, scroll to image, overlay the box ──────
  const showAnnotation = async a => {
    setBusy(true);
    setError(null);
    try {
      await api.openStudy(studyUID).catch(() => {});
      commandsManager.runCommand('loadStudy', { StudyInstanceUID: studyUID });

      const vpId = await waitForSeries(a.series_instance_uid, cornerstoneViewportService);
      if (!vpId) {
        throw new Error('Series loaded but not found in the viewport');
      }
      const csVp = cornerstoneViewportService.getCornerstoneViewport(vpId);
      const imageId = await scrollToAnnotationImage(csVp, vpId, a, cornerstoneViewportService);
      if (!imageId) {
        throw new Error('Could not locate the annotated image in the series');
      }
      overlayBBox(a, imageId, vpId, cornerstoneViewportService);
    } catch (e) {
      console.warn('[AI Labeling] showAnnotation error:', e);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── export: ALL cases in the selected project (per Anas: export includes
  //     every case's labels, not just the current study). Password-protected:
  //     prompts for the export password, server validates it. ──
  // Images are rendered CLIENT-SIDE at native resolution with the windowing
  // the labeler applied (stored per annotation) — the server preview endpoint
  // can't do custom windowing, and always rendered frame 0 of multi-frame
  // series. The rendered PNGs are posted to the backend which zips them with
  // the labels + manifest.
  const exportYolo = async () => {
    if (!selectedProjectId) {
      setError('No project selected');
      return;
    }
    const password = window.prompt('Enter export password');
    if (password == null) return; // cancelled
    setBusy(true);
    setError(null);
    setExportProgress('Collecting annotations…');
    try {
      const anns = await api.projectAnnotations(selectedProjectId);
      if (!anns.length) throw new Error('No annotations in this project yet');

      // unique images to render (multiple boxes on the same slice → one PNG)
      const byKey = new Map();
      for (const a of anns) {
        const key = `${a.sop_instance_uid}#${a.frame_number || 1}`;
        if (!byKey.has(key)) {
          const d = a.data || {};
          byKey.set(key, {
            study: a.study_instance_uid,
            series: a.series_instance_uid,
            sop: a.sop_instance_uid,
            frame: a.frame_number || 1,
            ww: d.windowWidth,
            wc: d.windowCenter,
            invert: d.invert,
          });
        }
      }

      const images = {};
      const total = byKey.size;
      let done = 0;
      for (const [key, img] of byKey) {
        done += 1;
        setExportProgress(`Rendering image ${done}/${total}…`);
        try {
          // grant this browser's DICOMweb access to the study (idempotent)
          await api.openStudy(img.study).catch(() => {});
          const png = await renderAnnotationPng(img);
          if (png) images[key] = png;
        } catch (e) {
          console.warn('[AI Labeling] export render failed', key, e);
        }
      }
      if (!Object.keys(images).length) {
        throw new Error('Could not render any annotated image — open the study in the viewer first, then retry');
      }

      setExportProgress('Building zip…');
      const { blob, filename } = await api.exportProjectYoloRendered(selectedProjectId, images, password);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Server names the zip: <project>_<YYYYMMDD>_<HHMMSS>.zip
      link.download =
        filename ||
        `${(projects.find(p => p.id === selectedProjectId)?.name || 'yolo').replace(/[^A-Za-z0-9_-]+/g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.status === 403 ? 'Wrong export password' : e.message);
    } finally {
      setBusy(false);
      setExportProgress(null);
    }
  };

  // ── project management ──────────────────────────────────────────────────
  const handleCreateProject = async (name, labelNames) => {
    setBusy(true);
    setError(null);
    try {
      const d = await api.createProject({ name, labels: labelNames });
      await loadProjects();
      if (d && d.project) setSelectedProjectId(d.project.id);
      setShowCreateProject(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddLabel = async name => {
    if (!selectedProjectId) return;
    setBusy(true);
    setError(null);
    try {
      await api.addProjectLabel(selectedProjectId, name);
      refreshSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRenameLabel = async (labelId, name) => {
    if (!selectedProjectId) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateProjectLabel(selectedProjectId, labelId, name);
      setEditingLabel(null);
      refreshSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLabel = async labelId => {
    if (!selectedProjectId) return;
    if (!window.confirm('Delete this label? Existing annotations keep their name, but the label will no longer be offered.')) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.deleteProjectLabel(selectedProjectId, labelId);
      refreshSummary();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────
  const short = uid => (uid && uid.length > 28 ? uid.slice(0, 18) + '…' + uid.slice(-8) : uid);

  if (!ready) {
    return (
      <div className="p-2 text-sm text-white/80">
        {authError || 'Connecting to labeling backend…'}
      </div>
    );
  }

  const labels = (summary && summary.labels) || [];
  const annotations = (summary && summary.annotations) || [];

  return (
    <div className="flex flex-col gap-3 p-2 text-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
        Quick Label
      </div>

      {!studyUID && (
        <div className="text-xs text-white/70">
          Open a study first (e.g. from the search page), then come back here to label it.
        </div>
      )}

      {studyUID && (
        <>
          {/* ── project selector (which project we use) ── */}
          <div className="rounded border border-primary/20 bg-black/40 p-2 text-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Project
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <select
                className="h-7 min-w-0 flex-1 rounded border border-white/30 bg-black/60 px-1.5 text-xs text-white"
                value={selectedProjectId || ''}
                onChange={e => setSelectedProjectId(Number(e.target.value) || null)}
              >
                {projects.length === 0 && <option value="">No project yet…</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                onClick={() => setShowCreateProject(true)}
              >
                + New
              </Button>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-white/60">Study:</span>
              <span className="text-white">{short(studyUID)}</span>
            </div>
            <Button variant="ghost" size="sm" className="mt-1 h-6 px-2 text-[11px]" onClick={refreshSummary}>
              Refresh list
            </Button>
          </div>

          {showCreateProject && (
            <CreateProjectForm
              busy={busy}
              onCancel={() => setShowCreateProject(false)}
              onCreate={handleCreateProject}
            />
          )}

          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Annotation tool
            </div>
            <Button
              variant={bboxActive ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-1.5"
              onClick={bboxActive ? deactivateBBoxTool : activateBBoxTool}
            >
              <Icons.ByName name="tool-rectangle" className="h-4 w-4" />
              {bboxActive ? 'Drawing… click-drag on the image' : 'Bounding Box'}
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                Labels
              </div>
              <LabelInput
                placeholder="+ add label"
                buttonLabel="Add"
                onSubmit={handleAddLabel}
                busy={busy}
              />
            </div>
            {labels.length === 0 && (
              <div className="text-xs text-white/70">
                None yet — draw a box and type a label.
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {labels.map(l => {
                const name = norm(l.name);
                const color = labelColor(name);
                if (editingLabel && editingLabel.labelId === l.id) {
                  return (
                    <LabelInput
                      key={l.id}
                      defaultValue={name}
                      buttonLabel="Save"
                      busy={busy}
                      onSubmit={v => handleRenameLabel(l.id, v)}
                      onCancel={() => setEditingLabel(null)}
                    />
                  );
                }
                return (
                  <span
                    key={l.id}
                    className="flex items-center gap-1.5 rounded-full border border-white/30 px-2 py-0.5 text-xs text-white uppercase"
                  >
                    <span style={dotStyle(color)} />
                    {name} <span className="text-white/60">({l.count})</span>
                    <button
                      type="button"
                      className="text-white/50 hover:text-white"
                      title="Edit label"
                      onClick={() => setEditingLabel({ labelId: l.id, name })}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="text-red-400/80 hover:text-red-300"
                      title="Delete label"
                      onClick={() => handleDeleteLabel(l.id)}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Annotations ({annotations.length})
            </div>
            {annotations.length === 0 && (
              <div className="text-xs text-white/70">
                Draw a bounding box on the image, then type the label.
              </div>
            )}
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
              {annotations.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className="flex cursor-pointer items-center justify-between gap-2 rounded border border-primary/20 px-2 py-1 text-left hover:bg-secondary/50"
                  onClick={() => showAnnotation(a)}
                >
                  <span className="truncate">
                    <span className="mr-1 inline-block" style={dotStyle(labelColor(norm(a.label)))} />
                    <span className="text-white uppercase">{norm(a.label)}</span>
                    <span className="ml-1 text-[10px] text-white/60">
                      #{a.frame_number}
                    </span>
                  </span>
                  <span className="text-[10px] text-white/60">view →</span>
                </button>
              ))}
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={exportYolo} disabled={busy || !selectedProjectId}>
            Export YOLO (all cases in project)
          </Button>
          {exportProgress && <div className="text-[11px] text-white/70">{exportProgress}</div>}
        </>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}

      <LabelPickerModal
        isOpen={!!pendingBBox}
        existingLabels={labels}
        onCancel={() => {
          setPendingBBox(null);
          deactivateBBoxTool();
        }}
        onSave={saveBBox}
      />
    </div>
  );
}

// ── Create-project form (topic + label list) ───────────────────────────────
function CreateProjectForm({ busy, onCancel, onCreate }) {
  const [name, setName] = useState('');
  const [labelsText, setLabelsText] = useState('');

  const canSave = name.trim().length > 0;
  return (
    <div className="rounded border border-primary/20 bg-black/40 p-2 text-xs">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
        New project
      </div>
      <input
        className="mt-1 h-7 w-full rounded border border-white/30 bg-black/60 px-1.5 text-xs text-white placeholder:text-white/40"
        placeholder="Topic, e.g. BRAIN TUMOR"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <textarea
        className="mt-1 h-16 w-full rounded border border-white/30 bg-black/60 px-1.5 py-1 text-xs text-white placeholder:text-white/40"
        placeholder="Labels, one per line — e.g.&#10;EDEMA&#10;HEMORRHAGE"
        value={labelsText}
        onChange={e => setLabelsText(e.target.value)}
      />
      <div className="mt-1 flex justify-end gap-1">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-6 px-2 text-[11px]"
          disabled={!canSave || busy}
          onClick={() =>
            onCreate(name.trim(), labelsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean))
          }
        >
          Create
        </Button>
      </div>
    </div>
  );
}

// ── Inline label add / edit input ──────────────────────────────────────────
function LabelInput({ defaultValue = '', placeholder, buttonLabel = 'Add', busy, onSubmit, onCancel }) {
  const [value, setValue] = useState(defaultValue);
  const canSave = value.trim().length > 0;
  return (
    <div className="flex items-center gap-1">
      <input
        className="h-6 w-24 rounded border border-white/30 bg-black/60 px-1.5 text-[11px] text-white uppercase placeholder:text-white/40"
        placeholder={placeholder || 'label'}
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase())}
        onKeyDown={e => {
          if (e.key === 'Enter' && canSave) {
            onSubmit(value.trim().toUpperCase());
            setValue('');
          }
        }}
      />
      <Button
        size="sm"
        className="h-6 px-2 text-[11px]"
        disabled={!canSave || busy}
        onClick={() => {
          onSubmit(value.trim().toUpperCase());
          setValue('');
        }}
      >
        {buttonLabel}
      </Button>
      {onCancel && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={onCancel}>
          ✕
        </Button>
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Render one annotated frame at NATIVE resolution with the windowing the
 * labeler had applied (stored on the annotation at draw time). Falls back to
 * the image's own windowing tags, then full pixel range.
 * Returns { png: base64, w, h } or null on failure.
 */
async function renderAnnotationPng({ study, series, sop, frame, ww, wc, invert }) {
  const imageId = `wadors:${window.location.origin}/api/dicom-web/studies/${study}/series/${series}/instances/${sop}/frames/${frame || 1}`;
  let image = null;
  try {
    image = cache.getImage(imageId);
  } catch (e) {
    /* cache miss — load below */
  }
  if (!image) {
    image = await imageLoader.loadImage(imageId);
  }
  if (!image) return null;

  const width = image.width || image.columns;
  const height = image.height || image.rows;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(width, height);
  const px = image.getPixelData && image.getPixelData();
  if (!px) return null;

  if (image.color) {
    // RGB(A) secondary captures / screenshots — copy as-is
    const spp = image.rgba ? 4 : 3;
    for (let i = 0, j = 0; i < px.length && j < out.data.length; i += spp, j += 4) {
      out.data[j] = px[i];
      out.data[j + 1] = px[i + 1];
      out.data[j + 2] = px[i + 2];
      out.data[j + 3] = 255;
    }
  } else {
    // MONOCHROME — apply the stored (adjusted) windowing
    const slope = Number(image.slope) || 1;
    const intercept = Number(image.intercept) || 0;
    let wwNum = Number.isFinite(Number(ww)) ? Number(ww) : NaN;
    let wcNum = Number.isFinite(Number(wc)) ? Number(wc) : NaN;
    if (!Number.isFinite(wwNum) || !Number.isFinite(wcNum) || wwNum <= 0) {
      const imgWw = Number(image.windowWidth);
      const imgWc = Number(image.windowCenter);
      if (Number.isFinite(imgWw) && Number.isFinite(imgWc) && imgWw > 0) {
        wwNum = imgWw;
        wcNum = imgWc;
      } else {
        const mn = image.minPixelValue != null ? image.minPixelValue : 0;
        const mx = image.maxPixelValue != null ? image.maxPixelValue : 255;
        wwNum = mx - mn || 1;
        wcNum = (mx + mn) / 2;
      }
    }
    const flip = !!invert;
    const n = width * height;
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      let v = Number(px[i]) * slope + intercept;
      v = (v - wcNum) / wwNum + 0.5;
      if (flip) v = 1 - v;
      v = Math.min(1, Math.max(0, v));
      const g = Math.round(v * 255);
      out.data[j] = g;
      out.data[j + 1] = g;
      out.data[j + 2] = g;
      out.data[j + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  const b64 = await blobToBase64(blob);
  return { png: b64, w: width, h: height };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

/** Find the cs3d viewport currently displaying the given imageId. */
function findViewportByImageId(imageId, cornerstoneViewportService) {
  try {
    const ids = cornerstoneViewportService.getViewportIds();
    for (const vpId of ids) {
      const vp = cornerstoneViewportService.getCornerstoneViewport(vpId);
      if (vp && typeof vp.getCurrentImageId === 'function') {
        if (vp.getCurrentImageId() === imageId) return vp;
      }
    }
  } catch (err) {
    console.warn('[AI Labeling] findViewportByImageId error:', err);
  }
  return null;
}

/**
 * Convert world-space corner points to a pixel-space bbox using the
 * viewport's own imageData (worldToIndex) — no metadata lookup needed,
 * so it works even when imagePlaneModule isn't registered for the imageId.
 */
function worldToPixelBBoxFromViewport(worldPoints, vp) {
  try {
    const img = vp.getImageData();
    if (!img || !img.imageData || !img.dimensions) return null;
    const { imageData, dimensions } = img;
    const [columns, rows] = dimensions;

    const xs = [];
    const ys = [];
    for (const p of worldPoints) {
      const idx = imageData.worldToIndex(p);
      xs.push(idx[0]);
      ys.push(idx[1]);
    }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    return {
      x1: clamp(Math.min(...xs), 0, columns),
      y1: clamp(Math.min(...ys), 0, rows),
      x2: clamp(Math.max(...xs), 0, columns),
      y2: clamp(Math.max(...ys), 0, rows),
      imageWidth: columns,
      imageHeight: rows,
    };
  } catch (err) {
    console.warn('[AI Labeling] worldToPixelBBoxFromViewport error:', err);
    return null;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForSeries(seriesUID, cornerstoneViewportService, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ids = cornerstoneViewportService.getViewportIds();
    for (const vpId of ids) {
      const displaySets = cornerstoneViewportService.getViewportDisplaySets(vpId) || [];
      if (displaySets.some(ds => ds.SeriesInstanceUID === seriesUID)) {
        return vpId;
      }
    }
    await sleep(500);
  }
  return null;
}

async function scrollToAnnotationImage(csVp, vpId, annotation, cornerstoneViewportService) {
  // find index of the SOP in the series display set
  const displaySets = cornerstoneViewportService.getViewportDisplaySets(vpId) || [];
  const ds = displaySets.find(d => d.SeriesInstanceUID === annotation.series_instance_uid);
  let index = 0;
  if (ds && Array.isArray(ds.images) && ds.images.length > 1) {
    index = ds.images.findIndex(img => img.SOPInstanceUID === annotation.sop_instance_uid);
    if (index < 0) index = Math.min((annotation.frame_number || 1) - 1, ds.images.length - 1);
  } else if (annotation.frame_number > 1) {
    index = annotation.frame_number - 1;
  }
  try {
    if (typeof csVp.setImageIdIndex === 'function') {
      csVp.setImageIdIndex(index);
      await sleep(300);
    }
  } catch (e) {
    console.warn('[AI Labeling] scroll error:', e);
  }
  return csVp.getCurrentImageId();
}

function overlayBBox(annotation, imageId, vpId, cornerstoneViewportService) {
  const worldPoints = pixelToWorldBBox(annotation.bbox, imageId);
  const plane = metaData.get('imagePlaneModule', imageId);
  if (!worldPoints || !plane) {
    console.warn('[AI Labeling] overlay: no plane metadata for', imageId);
    return;
  }

  // remove previously overlaid boxes
  csAnnotation.state
    .getAllAnnotations()
    .filter(a => a.annotationUID && a.annotationUID.startsWith('ailabel-'))
    .forEach(a => csAnnotation.state.removeAnnotation(a.annotationUID));

  const csVp = cornerstoneViewportService.getCornerstoneViewport(vpId);
  if (!csVp) {
    console.warn('[AI Labeling] overlay: no cornerstone viewport for', vpId);
    return;
  }
  // cs3d 5.x exposes the DOM element as a property (this.element), not getElement()
  const element = csVp.element || csVp.getElement?.();
  if (!element) {
    console.warn('[AI Labeling] overlay: viewport has no element', vpId);
    return;
  }
  const overlay = {
    annotationUID: `ailabel-${annotation.id}`,
    data: {
      handles: {
        points: worldPoints,
        textBox: {
          hasMoved: false,
          worldPosition: worldPoints[0],
          worldBoundingBox: {},
        },
      },
      label: annotation.label,
      cachedStats: {},
    },
    highlighted: false,
    invalidated: true,
    isLocked: false,
    isVisible: true,
    metadata: {
      toolName: 'RectangleROI',
      viewPlaneNormal: cross3(plane.rowCosines, plane.columnCosines),
      viewUp: plane.rowCosines,
      FrameOfReferenceUID: plane.frameOfReferenceUID,
      referencedImageId: imageId,
    },
    parentAnnotationUID: null,
  };

  csAnnotation.state.addAnnotation(overlay, element);

  // per-annotation color so the box on the image matches its label dot
  try {
    const color = labelColor(annotation.label);
    csAnnotation.config.style.setAnnotationStyles(overlay.annotationUID, {
      color,
      colorHighlighted: color,
      colorSelected: color,
    });
  } catch (err) {
    console.warn('[AI Labeling] setAnnotationStyles error:', err);
  }

  triggerAnnotationRenderForViewportIds([vpId]);
}
