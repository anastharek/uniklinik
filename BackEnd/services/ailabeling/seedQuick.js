'use strict'

/**
 * Quick Label bootstrap (Phase 0 minimal flow — no login UI):
 *   - `demo` / `demo123` labeler account (the panel auto-logs-in as this)
 *   - "Quick Label" project (cases + labels are auto-created per study on demand)
 * Run: docker exec pmstroke5.1 node services/ailabeling/seedQuick.js
 * Idempotent.
 */
const bcrypt = require('bcryptjs')
const db = require('../../database/models')

const AiLabelUser = db.AiLabelUser
const AiLabelProject = db.AiLabelProject

async function main() {
  const [demo, demoCreated] = await AiLabelUser.findOrCreate({
    where: { username: 'demo' },
    defaults: { password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Demo Labeler', role: 'labeler' },
  })

  const [project, projectCreated] = await AiLabelProject.findOrCreate({
    where: { name: 'Quick Label' },
    defaults: {
      description: 'Minimal no-login labeling flow (auto cases/labels per study)',
      annotation_type: 'bbox',
    },
  })

  console.log(`demo/demo123 ${demoCreated ? 'CREATED' : 'EXISTS'} (id=${demo.id})`)
  console.log(`Quick Label project ${projectCreated ? 'CREATED' : 'EXISTS'} (id=${project.id})`)
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
