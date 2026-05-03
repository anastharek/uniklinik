function OnStoredInstance(instanceId, tags, metadata, origin)
   if origin['RequestOrigin'] ~= 'Lua' then
      local modifyRequest = {}

      modifyRequest["Remove"] = {}
      table.insert(modifyRequest["Remove"], "OperatorsName")

      modifyRequest["Replace"] = {}
      modifyRequest["Replace"]["InstitutionName"] = "PUTRA CNS"
      modifyRequest["Replace"]["SOPInstanceUID"] = tags["SOPInstanceUID"]
      modifyRequest["Force"] = true

      local modifiedDicom = RestApiPost('/instances/' .. instanceId .. '/modify', DumpJson(modifyRequest))
      local uploadResponse = ParseJson(RestApiPost('/instances', modifiedDicom))

      if (uploadResponse["Status"] == 'AlreadyStored') then
         print("Are you sure you've enabled 'OverwriteInstances' option?")
      end

      if (uploadResponse["ID"] ~= instanceId) then
         print("Modified instance and original instance don't have the same Orthanc IDs!")
      end

      print('Replaced InstitutionName in instance ' .. instanceId)
   end
end

function OnStableStudy(studyId, tags, metadata)
   RestApiPost('/studies/' .. studyId .. '/reconstruct', "")
   print('Reconstructed Index DB data for study ' .. studyId)
end
