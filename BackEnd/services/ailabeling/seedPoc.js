'use strict'

/**
 * Phase 0 POC seed — AI Labeling
 * Run inside the padipacs container:
 *   docker exec pmstroke5.1 node services/ailabeling/seedPoc.js
 * Idempotent: skips existing users/project (matched by username / project name).
 */
const bcrypt = require('bcryptjs')
const db = require('../../database/models')

const AiLabelUser = db.AiLabelUser
const AiLabelProject = db.AiLabelProject
const AiLabelProjectLabel = db.AiLabelProjectLabel
const AiLabelCase = db.AiLabelCase

const POC_CASES = [
  {
    case_code: 'POC0001',
    study_instance_uid: '1.2.840.113619.6.95.31.0.3.4.1.1529.13.122643',
    series_instance_uid: '1.3.46.670589.11.71956.5.0.6728.2026080814291688000' // sb1000
  },
  {
    case_code: 'POC0002',
    study_instance_uid: '1.2.840.113619.6.95.31.0.3.4.1.1529.13.122643',
    series_instance_uid: '1.3.46.670589.11.71956.5.0.9572.2026080814291052000' // sb100
  },
  {
    case_code: 'POC0003',
    study_instance_uid: '1.2.840.113619.6.95.31.0.3.4.1.1529.13.122643',
    series_instance_uid: '1.3.46.670589.11.71956.5.0.8288.2026080814264331264' // DWI_og
  }
]

const LABELS = [
  { class_id: 0, name: 'Hemorrhage', color: '#e6194b' },
  { class_id: 1, name: 'Infarct', color: '#3cb44b' },
  { class_id: 2, name: 'Tumor/Mass', color: '#ffe119' },
  { class_id: 3, name: 'Edema', color: '#4363d8' },
  { class_id: 4, name: 'Artifact', color: '#f58231' }
]

async function main() {
  const [admin, createdAdmin] = await AiLabelUser.findOrCreate({
    where: { username: 'admin' },
    defaults: { password_hash: bcrypt.hashSync('admin123', 10), full_name: 'System Admin', role: 'admin' }
  })
  const [ali, createdAli] = await AiLabelUser.findOrCreate({
    where: { username: 'ali' },
    defaults: { password_hash: bcrypt.hashSync('label123', 10), full_name: 'Ali', role: 'labeler' }
  })
  const [drsiti, createdDrsiti] = await AiLabelUser.findOrCreate({
    where: { username: 'drsiti' },
    defaults: { password_hash: bcrypt.hashSync('label123', 10), full_name: 'Dr Siti', role: 'validator' }
  })

  const [project, createdProject] = await AiLabelProject.findOrCreate({
    where: { name: 'POC Brain MRI Lesion Detection' },
    defaults: {
      description: 'Phase 0 proof of concept — bounding box labeling on MRI brain series.',
      annotation_type: 'bbox',
      status: 'active',
      created_by: admin.id
    }
  })

  for (const l of LABELS) {
    await AiLabelProjectLabel.findOrCreate({
      where: { project_id: project.id, class_id: l.class_id },
      defaults: { name: l.name, color: l.color, is_active: true }
    })
  }

  for (const c of POC_CASES) {
    await AiLabelCase.findOrCreate({
      where: { project_id: project.id, case_code: c.case_code },
      defaults: {
        study_instance_uid: c.study_instance_uid,
        series_instance_uid: c.series_instance_uid,
        status: 'assigned',
        assigned_labeler_id: ali.id,
        assigned_validator_id: drsiti.id
      }
    })
  }

  console.log('=== AI Labeling POC seed complete ===')
  console.log('admin  / admin123  (role: admin)')
  console.log('ali    / label123  (role: labeler)')
  console.log('drsiti / label123  (role: validator)')
  console.log(`Project: ${project.name} (id=${project.id}) — ${LABELS.length} labels, ${POC_CASES.length} cases assigned to ali`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
