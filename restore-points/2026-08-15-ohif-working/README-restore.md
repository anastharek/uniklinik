# Restore point — 2026-08-15 ohif-working

State: OHIF v3.12.12 viewer fully functional (A.I. Viewer + OHIF Viewer buttons).
Fixes included:
1. Deep-link format `/viewer-ohif/viewer/dicomweb?StudyInstanceUIDs=<uid>` (commit 1)
2. ReverseProxy streams upstream headers (Content-Type multipart boundary) (commit 2)

To restore:
- Code: `code/PUTRACNS-code-HEAD-f7eccec.tar.gz` (kept local on NAS, NOT in git)
- Image: `docker tag pdml/padimedicalstroke5:3-ohif-working pdml/padimedicalstroke5:3`
- Compose: `compose/docker-compose.yml`
- Git: tag `ohif-working-20260815`
