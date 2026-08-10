-- =============================================================================
-- Orthanc Lua Script — PUTRACNS Stroke/Neurovascular PACS
-- =============================================================================
-- ACCEPTANCE RULES:
-- CT  → Brain / Head / Stroke keywords
-- MR  → PUTRA/STROKE protocol OR description/body part contains BRAIN
-- XA  → Brain/Head angio
-- All other modalities → DELETED
-- Non-image SOP classes → DELETED
--
-- ReceivedInstanceFilter: rejects BEFORE storage (saves CPU/disk)
--   NOTE: Orthanc >= 1.12 renamed this callback from IncomingDicomInstanceFilter
--   AND changed its contract:
--     * first arg = ALREADY-PARSED simplified DICOM tags (a Lua table),
--       NOT raw DICOM bytes (no DicomToJson/ParseJson needed)
--     * must return TRUE (accept) / FALSE (reject) — a boolean predicate,
--       NOT the dicom table or nil (old pre-1.12 behavior)
--     * origin is a JSON table with origin["RequestOrigin"] (e.g. "Lua",
--       "RestApi", "DicomProtocol") — NOT a plain string
--   Using the OLD name/contract silently disables or errors filtering.
-- OnStoredInstance: tags accepted instances only
-- =============================================================================

function Log(msg)
   print('[MODIFY.LUA] ' .. os.date('%Y-%m-%d %H:%M:%S') .. ' | ' .. msg)
end

local function upper(tag)
   if tag == nil then return '' end
   return string.upper(tostring(tag)):gsub('^%s+', ''):gsub('%s+$', '')
end

-- =============================================================================
-- NON-IMAGE SOP CLASSES
-- =============================================================================
local NON_IMAGE_SOP_CLASSES = {
   ['1.2.840.10008.5.1.4.1.1.11.1']   = 'GSPS',
   ['1.2.840.10008.5.1.4.1.1.11.2']   = 'ColorPS',
   ['1.2.840.10008.5.1.4.1.1.11.3']   = 'PseudoColorPS',
   ['1.2.840.10008.5.1.4.1.1.11.4']   = 'BlendingPS',
   ['1.2.840.10008.5.1.4.1.1.11.5']   = 'XA-XRFPS',
   ['1.2.840.10008.5.1.4.1.1.66']     = 'RawData',
   ['1.2.840.10008.5.1.4.1.1.66.1']   = 'RawData',
   ['1.2.840.10008.5.1.4.1.1.88.11']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.22']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.33']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.34']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.40']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.50']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.59']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.65']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.88.67']  = 'SR',
   ['1.2.840.10008.5.1.4.1.1.481.2']  = 'RTDose',
   ['1.2.840.10008.5.1.4.1.1.481.3']  = 'RTStruct',
   ['1.2.840.10008.5.1.4.1.1.481.5']  = 'RTPlan',
   ['1.2.840.10008.5.1.4.1.1.481.9']  = 'RTTreatRec',
   ['1.2.840.10008.5.1.4.1.1.104.1']  = 'EncapsulatedPDF',
   ['1.2.840.10008.5.1.4.1.1.104.2']  = 'EncapsulatedCDA',
}

-- =============================================================================
-- ReceivedInstanceFilter — reject BEFORE storage (saves CPU/disk)
-- Orthanc 1.12+ contract: ReceivedInstanceFilter(simplifiedTags, origin, info)
-- returns TRUE (accept) or FALSE (reject).
-- =============================================================================
function ReceivedInstanceFilter(tags, origin, info)
   -- Only filter incoming DICOM from remote senders (not internal/Lua operations)
   if type(origin) == 'table' and origin['RequestOrigin'] == 'Lua' then
      return true  -- accept, don't filter internal operations
   end

   -- "tags" is already the simplified DICOM tags (a Lua table) in 1.12+
   if type(tags) ~= 'table' then
      -- Defensive: if we somehow got raw bytes, parse them
      local ok, parsed = pcall(function()
         return ParseJson(DicomToJson(tags))
      end)
      if not ok or parsed == nil then
         return true  -- can't parse — let Orthanc handle it
      end
      tags = parsed
   end

   local sopClassUid = tags['SOPClassUID'] or ''

   -- Non-image SOP → reject immediately
   local nonImageType = NON_IMAGE_SOP_CLASSES[sopClassUid]
   if nonImageType then
      Log('✗ PRE-STORAGE REJECT: Non-image SOP — ' .. nonImageType)
      return false  -- reject, never stored
   end

   local modality = upper(tags['Modality'] or '')
   local bodyPart = upper(tags['BodyPartExamined'] or '')
   local studyDesc = upper(tags['StudyDescription'] or '')
   local seriesDesc = upper(tags['SeriesDescription'] or '')
   local protocol = upper(tags['ProtocolName'] or '')
   local reqProc = upper(tags['RequestedProcedureDescription'] or '')
   local combined = bodyPart .. ' ' .. studyDesc .. ' ' .. seriesDesc .. ' ' .. protocol .. ' ' .. reqProc

   local reject = nil

   if modality == 'CT' then
      if combined:find('BRAIN') or combined:find('HEAD') or combined:find('STROKE') then
         if combined:find('PNS') then reject = 'CT: PNS' end
      else
         reject = 'CT: no BRAIN/HEAD/STROKE'
      end

   elseif modality == 'MR' then
      -- NOTE: BodyPartExamined is often absent in these DICOMs, so also
      -- accept when the description/protocol mentions BRAIN
      local isPutraStroke = combined:find('PUTRA') or combined:find('STROKE')
      local isBrain = (bodyPart == 'BRAIN') or combined:find('BRAIN')
      if not (isPutraStroke or isBrain) then
         reject = 'MR: not PUTRA/STROKE and not BRAIN'
      end

   elseif modality == 'XA' then
      if not (combined:find('BRAIN') or combined:find('HEAD')) then
         reject = 'XA: not brain/head angio'
      end

   elseif modality ~= '' then
      reject = 'Modality=' .. modality .. ' (not CT/MR/XA)'
   end

   if reject then
      Log('✗ PRE-STORAGE REJECT: ' .. reject)
      return false  -- reject, never touches disk
   end

   -- Accepted — let Orthanc store it
   Log('✓ Pre-accepted: ' .. modality)
   return true
end

-- =============================================================================
-- OnStoredInstance — tag accepted instances with InstitutionName
-- =============================================================================
function OnStoredInstance(instanceId, tags, metadata, origin)
   if origin['RequestOrigin'] == 'Lua' then return end

   -- Tag with InstitutionName (metadata-only, no decode)
   pcall(function()
      ModifyInstance(instanceId,
         { ['InstitutionName'] = 'PUTRA CNS' },
         { 'OperatorsName' },
         false
      )
   end)
end

-- =============================================================================
-- OnStableStudy — reconstruct (deferred during startup grace period)
-- =============================================================================
-- OnStableStudy: DISABLED — auto-reconstruct was causing OOM after restarts
-- when all studies would trigger simultaneous rebuilds
-- function OnStableStudy(studyId, tags, metadata)
--    local elapsed = os.time() - SCRIPT_START_TIME
--    if elapsed < STARTUP_GRACE_SECONDS then return end
--    pcall(function() RestApiPost('/studies/' .. studyId .. '/reconstruct', '') end)
-- end
