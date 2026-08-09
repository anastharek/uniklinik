-- =============================================================================
-- Orthanc Lua Script — PUTRACNS Stroke/Neurovascular PACS
-- =============================================================================
-- ACCEPTANCE RULES:
-- CT  → Brain / Head / Stroke keywords
-- MR  → PUTRA/STROKE protocol OR BodyPart = BRAIN
-- XA  → Brain/Head angio
-- All other modalities → DELETED
-- Non-image SOP classes → DELETED
--
-- IncomingDicomInstanceFilter: rejects BEFORE storage (saves CPU/disk)
-- OnStoredInstance: tags accepted instances only
-- =============================================================================

local SCRIPT_START_TIME = os.time()
local STARTUP_GRACE_SECONDS = 300

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
-- IncomingDicomInstanceFilter — reject BEFORE storage (saves CPU/disk)
-- =============================================================================
function IncomingDicomInstanceFilter(dicom, origin, info)
   -- Only filter incoming DICOM from remote senders (not internal/Lua operations)
   if origin == 'Lua' then return dicom end

   -- Parse minimal tags from the DICOM bytes (DicomToJson + ParseJson)
   local ok, parsed = pcall(function()
      return ParseJson(DicomToJson(dicom))
   end)
   if not ok or parsed == nil then
      -- Can't parse — let Orthanc handle it, OnStoredInstance will catch it
      return dicom
   end

   local sopClassUid = parsed['SOPClassUID'] or ''

   -- Non-image SOP → reject immediately
   local nonImageType = NON_IMAGE_SOP_CLASSES[sopClassUid]
   if nonImageType then
      Log('✗ PRE-STORAGE REJECT: Non-image SOP — ' .. nonImageType)
      return nil  -- nil = reject, never stored
   end

   local modality = upper(parsed['Modality'] or '')
   local bodyPart = upper(parsed['BodyPartExamined'] or '')
   local studyDesc = upper(parsed['StudyDescription'] or '')
   local seriesDesc = upper(parsed['SeriesDescription'] or '')
   local protocol = upper(parsed['ProtocolName'] or '')
   local reqProc = upper(parsed['RequestedProcedureDescription'] or '')
   local combined = bodyPart .. ' ' .. studyDesc .. ' ' .. seriesDesc .. ' ' .. protocol .. ' ' .. reqProc

   local reject = nil

   if modality == 'CT' then
      if combined:find('BRAIN') or combined:find('HEAD') or combined:find('STROKE') then
         if combined:find('PNS') then reject = 'CT: PNS' end
      else
         reject = 'CT: no BRAIN/HEAD/STROKE'
      end

   elseif modality == 'MR' then
      local isPutraStroke = combined:find('PUTRA') or combined:find('STROKE')
      local isBrain = bodyPart == 'BRAIN'
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
      return nil  -- nil = reject, never touches disk
   end

   -- Accepted — let Orthanc store it
   Log('✓ Pre-accepted: ' .. modality)
   return dicom
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
