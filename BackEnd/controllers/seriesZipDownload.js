const ReverseProxy = require("../model/ReverseProxy");
const Options = require("../model/Options");
const got = require('got');

/**
 * GET /api/dicom/studies/:studyInstanceUID/series/:seriesInstanceUID/download-zip
 *
 * Finds all instances belonging to the specified series in Orthanc,
 * downloads each original DICOM file, and streams them into a ZIP.
 * Does NOT use Orthanc's /series/{id}/archive — streams individual files.
 */
async function downloadSeriesZip(req, res) {
  const { studyInstanceUID, seriesInstanceUID } = req.params;

  try {
    // ── Resolve Orthanc address & auth ──
    const orthancSettings = Options.getOrthancConnexionSettings();
    // ORTHANC_ADDRESS may already include protocol (e.g. "http://orthanc")
    const baseUrl = orthancSettings.orthancAddress.startsWith('http')
      ? `${orthancSettings.orthancAddress}:${orthancSettings.orthancPort}`
      : `http://${orthancSettings.orthancAddress}:${orthancSettings.orthancPort}`;
    const auth = {
      username: orthancSettings.orthancUsername,
      password: orthancSettings.orthancPassword,
    };

    console.log(`[SERIES ZIP] Request: study=${studyInstanceUID} series=${seriesInstanceUID}`);

    // ── 1. Find Orthanc series ID via /tools/find ──
    const findResult = await ReverseProxy.getAnswer('/tools/find', 'POST', {
      Level: 'Series',
      Query: {
        StudyInstanceUID: studyInstanceUID,
        SeriesInstanceUID: seriesInstanceUID,
      },
    });

    const seriesIds = findResult || [];
    if (!seriesIds.length) {
      return res.status(404).json({
        error: 'Series not found in Orthanc',
        studyInstanceUID,
        seriesInstanceUID,
      });
    }

    const orthancSeriesId = seriesIds[0];

    // ── 2. Get series details (list of instance IDs) ──
    const seriesInfo = await ReverseProxy.getAnswer(`/series/${orthancSeriesId}`, 'GET');
    const instances = seriesInfo.Instances || [];

    if (!instances.length) {
      return res.status(404).json({
        error: 'No instances found for this series',
        studyInstanceUID,
        seriesInstanceUID,
      });
    }

    // ── 3. Build safe filename from series metadata ──
    const seriesDesc =
      seriesInfo.MainDicomTags?.SeriesDescription ||
      seriesInfo.MainDicomTags?.SeriesNumber ||
      seriesInstanceUID;
    const safeName = sanitizeFilename(String(seriesDesc));
    const zipFilename = `${safeName}_${seriesInstanceUID.slice(-12)}.zip`;

    // ── 4. Check for archiver (supports streaming ZIP) ──
    let archiver;
    try {
      archiver = require('archiver');
    } catch (e) {
      // Fallback: use Orthanc built-in archive endpoint
      console.log('[SERIES ZIP] archiver not installed, falling back to Orthanc archive endpoint');
      await ReverseProxy.streamToRes(`/series/${orthancSeriesId}/archive`, 'GET', undefined, res);
      return;
    }

    // ── 5. Stream ZIP to browser ──
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (error) => {
      console.error('[SERIES ZIP] Archive error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP archive' });
      } else {
        res.end();
      }
    });

    archive.pipe(res);

    // ── 6. Download each DICOM instance and add to ZIP ──
    let index = 1;
    for (const instanceId of instances) {
      try {
        const instanceStream = got.stream({
          url: `${baseUrl}/instances/${instanceId}/file`,
          username: auth.username,
          password: auth.password,
          headers: { Accept: 'application/dicom' },
          timeout: { request: 30000 },
        });

        const paddedIndex = String(index).padStart(6, '0');
        archive.append(instanceStream, {
          name: `${safeName}/IM_${paddedIndex}.dcm`,
        });

        index++;
      } catch (instanceErr) {
        console.warn(`[SERIES ZIP] Failed to fetch instance ${instanceId}: ${instanceErr.message}`);
        // Continue with remaining instances
      }
    }

    await archive.finalize();

    console.log(`[SERIES ZIP] Completed: ${orthancSeriesId} → ${index - 1}/${instances.length} files → ${zipFilename}`);

  } catch (error) {
    console.error('[SERIES ZIP] Failed:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download selected series ZIP',
        details: error.message,
      });
    }
  }
}

/**
 * Sanitize string for safe use as a filename.
 * Replaces unsafe characters with underscores, collapses whitespace, trims.
 */
function sanitizeFilename(name) {
  return String(name || 'series')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

module.exports = { downloadSeriesZip };
