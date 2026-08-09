#!/usr/bin/env bash
# =============================================================================
# Orthanc Cache Pre-warmer for Osimis Web Viewer
# =============================================================================
# Pre-renders study images through nginx proxy, warming both:
#   1. Osimis plugin internal cache (Orthanc side)
#   2. Nginx proxy cache (edge side)
#
# Skips non-image instances (GSPS, SR, RTSTRUCT, PR, etc.)
# Skips studies older than MAX_AGE_HOURS (default 72h)
#
# Usage:  ./prewarm.sh <study-uuid>
#         ./prewarm.sh --all           # pre-warm studies within age window
#         ./prewarm.sh --recent 5      # pre-warm latest 5 studies (age-filtered)
#         ./prewarm.sh --watch [interval_sec]  # daemon mode
# =============================================================================

set -euo pipefail

ORTHANC_URL="${ORTHANC_URL:-http://orthanc:8042}"
PROXY_URL="${PROXY_URL:-https://strokesvr.padimedical.com}"
CONCURRENT="${CONCURRENT:-8}"
MAX_FRAMES_PER_INSTANCE="${MAX_FRAMES_PER_INSTANCE:-0}"  # 0 = all frames
STATE_FILE="${STATE_FILE:-/tmp/prewarmed-studies.txt}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-72}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

now_epoch() { date +%s; }

# Check if a study's StudyDate is within MAX_AGE_HOURS
# Returns 0 if recent enough, 1 if too old
is_recent_study() {
    local study_id="$1"
    local cutoff_epoch
    cutoff_epoch=$(($(now_epoch) - MAX_AGE_HOURS * 3600))

    local study_date study_time
    read -r study_date study_time < <(curl -sf "${ORTHANC_URL}/osimis-viewer/studies/${study_id}" 2>/dev/null | \
        python3 -c "
import json,sys
d=json.load(sys.stdin).get('MainDicomTags',{})
print(d.get('StudyDate','00000000'), d.get('StudyTime','000000'))
" 2>/dev/null || echo "00000000 000000")

    # Parse StudyDate (YYYYMMDD) + StudyTime (HHMMSS) to epoch
    local year="${study_date:0:4}"
    local month="${study_date:4:2}"
    local day="${study_date:6:2}"
    local hour="${study_time:0:2}"
    local min="${study_time:2:2}"
    local sec="${study_time:4:2}"

    # Default to 0 to catch malformed dates
    year=${year:-0}; month=${month:-1}; day=${day:-1}
    hour=${hour:-0}; min=${min:-0}; sec=${sec:-0}

    # Strip leading zeros safely (2>/dev/null is invalid inside $((...)))
    year=$(echo "${year:-0}" | sed 's/^0*//')
    month=$(echo "${month:-1}" | sed 's/^0*//')
    day=$(echo "${day:-1}" | sed 's/^0*//')
    hour=$(echo "${hour:-0}" | sed 's/^0*//')
    min=$(echo "${min:-0}" | sed 's/^0*//')
    sec=$(echo "${sec:-0}" | sed 's/^0*//')
    year=$(( ${year:-0} ))
    month=$(( ${month:-1} ))
    day=$(( ${day:-1} ))
    hour=$(( ${hour:-0} ))
    min=$(( ${min:-0} ))
    sec=$(( ${sec:-0} ))

    local study_epoch
    study_epoch=$(date -d "${year}-${month}-${day} ${hour}:${min}:${sec}" +%s 2>/dev/null) || study_epoch=0

    if [ "$study_epoch" -lt "$cutoff_epoch" ]; then
        return 1  # too old
    fi
    return 0  # recent enough
}

# Returns 0 if the instance has pixel data (is renderable), 1 otherwise
is_renderable_image() {
    local instance_id="$1"
    local sop
    sop=$(curl -sf "${ORTHANC_URL}/instances/${instance_id}" 2>/dev/null | \
          python3 -c "
import json,sys
d=json.load(sys.stdin)
rows=d.get('MainDicomTags',{}).get('Rows','')
if rows: print('image')
" 2>/dev/null)
    [ -n "$sop" ]
}

prewarm_study() {
    local study_id="$1"

    # Skip if already pre-warmed
    if grep -qxF "$study_id" "$STATE_FILE" 2>/dev/null; then
        log "Study: $study_id [SKIP: already pre-warmed]"
        return 0
    fi

    log "Study: $study_id"

    local study_json
    study_json=$(curl -sf "${ORTHANC_URL}/osimis-viewer/studies/${study_id}" 2>/dev/null) || {
        log "  SKIP: study not found or not stable yet"
        return 1
    }

    local desc sdate stime
    read -r desc sdate stime < <(echo "$study_json" | python3 -c "
import json,sys
d=json.load(sys.stdin).get('MainDicomTags',{})
print(d.get('StudyDescription','?'), d.get('StudyDate','?'), d.get('StudyTime','?'))
" 2>/dev/null || echo "? ? ?")

    log "  Description: $desc ($sdate $stime)"

    # Check age filter
    if ! is_recent_study "$study_id"; then
        log "  SKIP: study older than ${MAX_AGE_HOURS}h window"
        echo "$study_id" >> "$STATE_FILE"  # mark as seen so we don't re-check
        return 0
    fi

    local series_list
    series_list=$(echo "$study_json" | python3 -c "import json,sys; print(' '.join(json.load(sys.stdin).get('Series',[])))" 2>/dev/null)

    local total=0
    local skipped=0
    local running=0

    for series_id in $series_list; do
        local instances
        instances=$(curl -sf "${ORTHANC_URL}/series/${series_id}" 2>/dev/null | \
            python3 -c "import json,sys; print(' '.join(json.load(sys.stdin).get('Instances',[])))" 2>/dev/null)

        for instance_id in $instances; do
            # Skip non-image instances (GSPS, SR, RTSTRUCT, etc.)
            if ! is_renderable_image "$instance_id"; then
                skipped=$((skipped + 1))
                continue
            fi

            # Get actual frame count (default 1 for single-frame)
            local num_frames
            num_frames=$(curl -sf "${ORTHANC_URL}/instances/${instance_id}" 2>/dev/null | \
                python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('MainDicomTags',{}).get('NumberOfFrames','1'))" 2>/dev/null)
            num_frames=${num_frames:-1}
            local max_f=$(( MAX_FRAMES_PER_INSTANCE == 0 ? num_frames : (num_frames < MAX_FRAMES_PER_INSTANCE ? num_frames : MAX_FRAMES_PER_INSTANCE) ))

            for frame in $(seq 0 $((max_f - 1))); do
                (
                    curl -sf -o /dev/null \
                        "${PROXY_URL}/osimis-viewer/images/${instance_id}/${frame}/high-quality" \
                        2>/dev/null
                ) &
                running=$((running + 1))
                total=$((total + 1))

                if [ $running -ge $CONCURRENT ]; then
                    wait -n 2>/dev/null || true
                    running=$((running - 1))
                fi
            done
        done
    done

    wait 2>/dev/null || true
    echo "$study_id" >> "$STATE_FILE"
    log "  Done: $total frames pre-warmed, $skipped non-image skipped"
    return 0
}

# --- Main ---
log "Orthanc Cache Pre-Warmer"
log "Orthanc: $ORTHANC_URL | Proxy: $PROXY_URL | Concurrent: $CONCURRENT | MaxAge: ${MAX_AGE_HOURS}h"

if [ "${1:-}" = "--all" ]; then
    studies=$(curl -sf "${ORTHANC_URL}/studies" | python3 -c "import json,sys; print('\n'.join(json.load(sys.stdin)))")
    count=$(echo "$studies" | wc -w)
    log "Pre-warming all $count studies (within ${MAX_AGE_HOURS}h window)..."
    for study in $studies; do
        prewarm_study "$study" || true
    done

elif [ "${1:-}" = "--recent" ]; then
    limit="${2:-5}"
    studies=$(curl -sf "${ORTHANC_URL}/studies" | python3 -c "import json,sys; print('\n'.join(json.load(sys.stdin)[-${limit}:]))")
    log "Pre-warming $limit most recent studies (within ${MAX_AGE_HOURS}h window)..."
    for study in $studies; do
        prewarm_study "$study" || true
    done

elif [ "${1:-}" = "--watch" ]; then
    # Daemon mode: poll for new studies every N seconds
    INTERVAL="${2:-120}"
    log "Watcher mode: polling every ${INTERVAL}s, max age ${MAX_AGE_HOURS}h"
    while true; do
        studies=$(curl -sf "${ORTHANC_URL}/studies" | python3 -c "import json,sys; print('\n'.join(json.load(sys.stdin)))" 2>/dev/null)
        new_count=0
        for study in $studies; do
            if ! grep -qxF "$study" "$STATE_FILE" 2>/dev/null; then
                new_count=$((new_count + 1))
            fi
        done
        if [ $new_count -gt 0 ]; then
            log "Found $new_count new study(ies), checking age and pre-warming..."
            for study in $studies; do
                prewarm_study "$study" || true
            done
        fi
        sleep "$INTERVAL"
    done

elif [ -n "${1:-}" ]; then
    prewarm_study "$1"

else
    echo "Usage: $0 <study-uuid> | --all | --recent [count] | --watch [interval_seconds]"
    echo "Env:  MAX_AGE_HOURS=$MAX_AGE_HOURS (skip studies older than this)"
    exit 1
fi

log "Complete"
