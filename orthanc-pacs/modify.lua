-- =============================================================================
-- Orthanc Lua Script — Automatic PatientName & PatientID Transformation
-- Path: /etc/orthanc/scripts/modify.lua
-- =============================================================================
-- Trigger: OnStoredInstance — runs on EVERY DICOM upload
-- Guard:   Skip if origin=Lua OR PatientName already == "CT BRAIN LVO"
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: remove ALL non-numeric characters from a string
-- ---------------------------------------------------------------------------
function ExtractDigits(str)
   if str == nil then return '' end
   return (str:gsub('%D', ''))
end

-- ---------------------------------------------------------------------------
-- Helper: format integer as "09" + 6-digit zero-padded string
--   e.g. FormatPatientID(168)  → "090000168"
--        FormatPatientID(206)  → "090000206"
--        FormatPatientID(0)    → "090000000"
-- ---------------------------------------------------------------------------
function FormatPatientID(num)
   -- "09" prefix + 7-digit zero-padded number → 9-digit PatientID
   -- e.g. 162 → "090000162", 206 → "090000206", 168 → "090000168"
   return '09' .. string.format('%07d', num)
end

-- ---------------------------------------------------------------------------
-- Helper: print timestamped log line to Orthanc logs
-- ---------------------------------------------------------------------------
function Log(msg)
   print('[MODIFY.LUA] ' .. os.date('%Y-%m-%d %H:%M:%S') .. ' | ' .. msg)
end

-- =========================================================================
-- OnStoredInstance — fired for every DICOM instance stored in Orthanc
-- =========================================================================
function OnStoredInstance(instanceId, tags, metadata, origin)
   -- GUARD 1: Skip if this instance was created by the Lua engine itself
   --          (prevents infinite modification loop)
   if origin['RequestOrigin'] == 'Lua' then
      Log('Skipping instance ' .. instanceId .. ' (origin = Lua)')
      return
   end

   -- GUARD 2: Skip if PatientName already equals the target name
   --          (double-safety against accidental re-processing)
   local currentPatientName = tags['PatientName'] or ''
   local currentPatientID   = tags['PatientID']   or ''

   Log('Instance: ' .. instanceId)
   Log('  Original PatientName : "' .. currentPatientName .. '"')
   Log('  Original PatientID   : "' .. currentPatientID   .. '"')

   if currentPatientName == 'CT BRAIN LVO' then
      Log('  ↳ PatientName already transformed — skipping')
      return
   end

   -- --------------------------------------------------------------------
   -- PATIENT ID TRANSFORMATION
   -- --------------------------------------------------------------------
   -- Step 1: Remove ALL non-numeric characters
   local digits = ExtractDigits(currentPatientID)
   Log('  Extracted digits     : "' .. digits .. '"')

   -- Step 2: Convert to integer (empty string defaults to 0)
   local num = tonumber(digits)
   if num == nil then
      num = 0
      Log('  ⚠ No digits found, defaulting to 0')
   end
   Log('  Integer value        : ' .. num)

   -- Step 3: Add 161
   local newNum = num + 161
   Log('  After +161           : ' .. newNum)

   -- Step 4: Format as "09" + 6-digit zero-padded string
   local newPatientID = FormatPatientID(newNum)
   Log('  Final PatientID      : "' .. newPatientID .. '"')

   -- --------------------------------------------------------------------
   -- BUILD MODIFY REQUEST (manual JSON — avoids DumpJson number coercion)
   -- DumpJson strips leading zeros from string values, so we construct the
   -- JSON payload manually to guarantee PatientID stays a quoted string.
   -- --------------------------------------------------------------------
   local sopUID = tags['SOPInstanceUID']

   local modifyJson = '{"Replace":{' ..
      '"InstitutionName":"PUTRA CNS",' ..
      '"PatientName":"CT BRAIN LVO",' ..
      '"PatientID":"' .. newPatientID .. '",' ..
      '"SOPInstanceUID":"' .. sopUID .. '"' ..
      '},"Remove":["OperatorsName"],"Force":true}'

   -- --------------------------------------------------------------------
   -- EXECUTE MODIFY (creates modified DICOM in memory)
   -- --------------------------------------------------------------------
   Log('  ↳ Sending modify request...')

   local ok, modifiedDicom = pcall(function()
      return RestApiPost('/instances/' .. instanceId .. '/modify', modifyJson)
   end)

   if not ok then
      Log('  ✗ Modify FAILED: ' .. tostring(modifiedDicom))
      return
   end

   -- --------------------------------------------------------------------
   -- RE-UPLOAD MODIFIED DICOM (overwrites original via Force + OverwriteInstances)
   -- --------------------------------------------------------------------
   local ok2, uploadResponse = pcall(function()
      return ParseJson(RestApiPost('/instances', modifiedDicom))
   end)

   if not ok2 then
      Log('  ✗ Upload FAILED: ' .. tostring(uploadResponse))
      return
   end

   -- --------------------------------------------------------------------
   -- VERIFICATION
   -- --------------------------------------------------------------------
   if uploadResponse['Status'] == 'AlreadyStored' then
      Log('  ⚠ OverwriteInstances may NOT be enabled. Check orthanc.json.')
   elseif uploadResponse['Status'] == 'Success' then
      Log('  ✓ SUCCESS — new PatientID = ' .. newPatientID)
      if uploadResponse['ID'] ~= instanceId then
         Log('  ↳ Overwritten instance (ID preserved: ' .. instanceId .. ')')
      end
   else
      Log('  ↳ Status: ' .. (uploadResponse['Status'] or 'UNKNOWN'))
   end
end

-- =========================================================================
-- OnStableStudy — reconstruct patient/study/series indexes after storage
-- =========================================================================
function OnStableStudy(studyId, tags, metadata)
   Log('Reconstructing study ' .. studyId .. ' (' ..
       (tags['PatientName'] or '?') .. ')')
   RestApiPost('/studies/' .. studyId .. '/reconstruct', '')
   Log('  ✓ Study ' .. studyId .. ' index rebuilt')
end
