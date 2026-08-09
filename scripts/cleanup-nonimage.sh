#!/bin/bash
# =============================================================================
# One-time cleanup: strip non-image series from existing large studies
# Run:  docker exec orthanc-pmstroke5.1 sh -c "bash ./cleanup.sh"
# or mount this script and run inside the orthanc container
# =============================================================================
# These studies are already stable (OnStableStudy won't fire again).
# This script does the same cleanup: removes GSPS, Raw Data, SR, etc.
# series so the Osimis viewer only sees diagnostic images.
# =============================================================================

ORTHANC_URL="${ORTHANC_URL:-http://localhost:8475}"
DRY_RUN="${DRY_RUN:-false}"

# Non-image SOPClassUIDs to strip
NON_IMAGE_SOP=(
    "1.2.840.10008.5.1.4.1.1.11.1"   # GSPS
    "1.2.840.10008.5.1.4.1.1.11.2"   # ColorPS
    "1.2.840.10008.5.1.4.1.1.11.3"   # PseudoColorPS
    "1.2.840.10008.5.1.4.1.1.11.4"   # BlendingPS
    "1.2.840.10008.5.1.4.1.1.11.5"   # XA-XRFPS
    "1.2.840.10008.5.1.4.1.1.66"     # RawData
    "1.2.840.10008.5.1.4.1.1.66.1"   # RawData (retired)
    "1.2.840.10008.5.1.4.1.1.88.11"  # BasicTextSR
    "1.2.840.10008.5.1.4.1.1.88.22"  # EnhancedSR
    "1.2.840.10008.5.1.4.1.1.88.33"  # ComprehensiveSR
    "1.2.840.10008.5.1.4.1.1.88.34"  # Comprehensive3DSR
    "1.2.840.10008.5.1.4.1.1.88.40"  # ProcedureLog
    "1.2.840.10008.5.1.4.1.1.88.59"  # KeyObjectSelection
    "1.2.840.10008.5.1.4.1.1.481.2"  # RTDose
    "1.2.840.10008.5.1.4.1.1.481.3"  # RTStructSet
    "1.2.840.10008.5.1.4.1.1.481.5"  # RTPlan
    "1.2.840.10008.5.1.4.1.1.104.1"  # EncapsulatedPDF
)

is_non_image() {
    local sop="$1"
    for nsop in "${NON_IMAGE_SOP[@]}"; do
        [[ "$sop" == "$nsop" ]] && return 0
    done
    return 1
}

cleanup_study() {
    local study_id="$1"
    local study_info
    study_info=$(curl -sf "${ORTHANC_URL}/studies/${study_id}" 2>/dev/null)
    if [[ -z "$study_info" ]]; then
        echo "  ✗ Cannot fetch study $study_id"
        return 1
    fi

    local patient
    patient=$(echo "$study_info" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('PatientMainDicomTags',{}).get('PatientName','?'))")
    local study_desc
    study_desc=$(echo "$study_info" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('MainDicomTags',{}).get('StudyDescription','?'))")
    local series_list
    series_list=$(echo "$study_info" | python3 -c "import json,sys; print(' '.join(json.load(sys.stdin).get('Series',[])))")

    echo "Study: $study_id"
    echo "  Patient: $patient | Description: $study_desc"
    echo "  Series total: $(echo "$series_list" | wc -w)"

    local removed=0
    local removed_series=0

    for series_id in $series_list; do
        local series_info
        series_info=$(curl -sf "${ORTHANC_URL}/series/${series_id}" 2>/dev/null)
        local instances
        instances=$(echo "$series_info" | python3 -c "import json,sys; print(' '.join(json.load(sys.stdin).get('Instances',[])[:1]))")

        local sop=""
        for iid in $instances; do
            sop=$(curl -sf "${ORTHANC_URL}/instances/${iid}" 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('MainDicomTags',{}).get('SOPClassUID',''))
")
            break
        done

        if [[ -n "$sop" ]] && is_non_image "$sop"; then
            local icount
            icount=$(echo "$series_info" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('Instances',[])))" 2>/dev/null)
            echo "    Removing series ${series_id} [${sop}] (${icount} inst)"
            if [[ "$DRY_RUN" != "true" ]]; then
                curl -sf -X DELETE "${ORTHANC_URL}/series/${series_id}" 2>/dev/null
            fi
            removed=$((removed + icount))
            removed_series=$((removed_series + 1))
        fi
    done

    echo "  ✓ Removed ${removed} non-image instances across ${removed_series} series"

    # Reconstruct study index
    if [[ "$DRY_RUN" != "true" ]]; then
        curl -sf -X POST "${ORTHANC_URL}/studies/${study_id}/reconstruct" 2>/dev/null
        echo "  ✓ Study index rebuilt"
    fi
}

echo "═══ Non-Image Series Stripper ═══"
echo "Orthanc: $ORTHANC_URL | Dry run: $DRY_RUN"
echo ""

if [[ -n "${1:-}" ]]; then
    cleanup_study "$1"
else
    echo "Usage: $0 <study-uuid>"
    echo "  DRY_RUN=true $0 <study-uuid>  # preview only"
fi
