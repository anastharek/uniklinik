'use strict'

/**
 * Add CT study (UPM000129637 — BrainRoutine, 2026-08-20) cases to the POC
 * project + create an `anas` admin account.
 * Run inside the padipacs container:
 *   docker exec pmstroke5.1 node services/ailabeling/seedCtasCases.js
 * Idempotent (findOrCreate by case_code / username).
 */
const bcrypt = require('bcryptjs')
const db = require('../../database/models')

const AiLabelUser = db.AiLabelUser
const AiLabelProject = db.AiLabelProject
const AiLabelCase = db.AiLabelCase

const STUDY_UID = '1.2.840.113619.6.95.31.0.3.4.1.1529.13.122691'

// CT Head series (skip Topogram + Patient Protocol)
const CT_CASES = [
  { case_code: 'POC0004', desc: 'CT Head 1.0 J30s', series: '1.3.12.2.1107.5.1.4.74527.30000026082000150213400005075' },
  { case_code: 'POC0005', desc: 'CT Head 5.0 J30s', series: '1.3.12.2.1107.5.1.4.74527.30000026082000150213400005039' },
  { case_code: 'POC0006', desc: 'CT Head 1.0 H70h', series: '1.3.12.2.1107.5.1.4.74527.30000026082000150213400005319' },
  { case_code: 'POC0007', desc: 'CT Head MPR cor', series: '1.3.12.2.1107.5.1.4.74527.30000026082000150213400005563' },
  { case_code: 'POC0008', desc: 'CT Head MPR sag', series: '1.3.12.2.1107.5.1.4.74527.30000026082000150213400005610' }
]

async function main() {
  const [anas, createdAnas] = await AiLabelUser.findOrCreate({
    where: { username: 'anas' },
    defaults: { password_hash: bcrypt.hashSync('anas123', 10), full_name: 'Anas', role: 'admin' }
  })

  const [ali] = await AiLabelUser.findOrCreate({
    where: { username: 'ali' },
    defaults: { password_hash: bcrypt.hashSync('label123', 10), full_name: 'Ali', role: 'labeler' }
  })
  const [drsiti] = await AiLabelUser.findOrCreate({
    where: { username: 'drsiti' },
    defaults: { password_hash: bcrypt.hashSync('label123', 10), full_name: 'Dr Siti', role: 'validator' }
  })

  const project = await AiLabelProject.findOne({ where: { name: 'POC Brain MRI Lesion Detection' } })
  if (!project) throw new Error('POC project not found — run seedPoc.js first')

  for (const c of CT_CASES) {
    const [row, created] = await AiLabelCase.findOrCreate({
      where: { project_id: project.id, case_code: c.case_code },
      defaults: {
        study_instance_uid: STUDY_UID,
        series_instance_uid: c.series,
        status: 'assigned',
        assigned_labeler_id: ali.id,
        assigned_validator_id: drsiti.id
      }
    })
    console.log(`${created ? 'CREATED' : 'EXISTS '} ${c.case_code} (${c.desc})`)
  }

  console.log('anas / anas123 (admin) ' + (createdAnas ? 'CREATED' : 'EXISTS'))
  console.log('CT cases added to project id=' + project.id + ' (study UPM000129637)')
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
