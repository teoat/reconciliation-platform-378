#!/usr/bin/env bash
set -euo pipefail

# Validation script for JSON and JSONC with classification and reports.
# Produces both text and JSON summaries under diagnostic-results/.

TS=$(date +"%Y%m%d_%H%M%S")
OUT_DIR="diagnostic-results"
TXT_OUT="$OUT_DIR/json_validation_${TS}.txt"
JSON_OUT="$OUT_DIR/json_validation_${TS}.json"

mkdir -p "$OUT_DIR"

# Directories to exclude (generated/build artifacts)
EXCLUDES=(
  "*/node_modules/*"
  "*/.git/*"
  "*/dist/*"
  "*/build/*"
  "*/backend/target/*"
  "*/frontend/coverage/.tmp/*"
  "*/playwright-report/*"
  "*/.next/*"
  "*/.vercel/*"
  "*/.cache/*"
)

# Classify file as JSONC or JSON based on name
classify() {
  local f="$1"
  local base
  base=$(basename "$f")
  case "$base" in
    tsconfig*.json|jsconfig.json)
      echo "JSONC" ;;
    *)
      echo "JSON" ;;
  esac
}

# Validate a JSON file strictly
validate_json() {
  local f="$1"
  if command -v node >/dev/null 2>&1; then
    node -e 'const fs=require("fs"); const p=process.argv[1]; try{ JSON.parse(fs.readFileSync(p,"utf8")); process.exit(0);}catch(e){ console.error(e.message); process.exit(1); }' "$f" 2>&1
  elif command -v jq >/dev/null 2>&1; then
    jq -e . "$f" >/dev/null 2>&1 || jq -e . "$f" 2>&1 | head -n 1
  else
    echo "no validator (node or jq) found"
    return 2
  fi
}

# Build find command arguments
find_args=(".")
prune_paths=()
for p in "${EXCLUDES[@]}"; do
  if [ -n "$p" ]; then
    prune_paths+=(-o -path "$p")
  fi
done
# Remove first -o
if [ ${#prune_paths[@]} -gt 0 ]; then
  prune_paths=("${prune_paths[@]:1}")
fi

find . \( "${prune_paths[@]}" \) -prune -o -type f -name '*.json' -print > "$OUT_DIR/.json_files_${TS}.list"

# Initialize outputs
printf "JSON validation report %s\n\n" "$TS" > "$TXT_OUT"
echo '{"timestamp":"'"$TS"'","files":[' > "$JSON_OUT"

FIRST=1
while IFS= read -r f; do
  # Skip excluded paths again defensively
  skip=false
  for p in "${EXCLUDES[@]}"; do
    if [[ "$f" == $(echo $p | sed "s/\*/.*/g") ]]; then skip=true; break; fi
  done
  $skip && continue || true

  kind=$(classify "$f")
  status="SKIPPED"
  error=""

  if [[ "$kind" == "JSON" ]]; then
    if out=$(validate_json "$f"); then
      status="VALID"
    else
      status="INVALID"
      error="$out"
    fi
  else
    status="JSONC-SKIPPED"
  fi

  printf "%s %s%s\n" "$status" "$f" "${error:+ :: $error}" | tee -a "$TXT_OUT"

  # Append to JSON report
  if [[ $FIRST -eq 0 ]]; then echo "," >> "$JSON_OUT"; fi
  FIRST=0
  # JSON-escape error
  esc_error=$(printf '%s' "$error" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '"%s"' "$error")
  printf '{"path":%s,"kind":"%s","status":"%s","error":%s}' \
    "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$f" 2>/dev/null || echo '"'$f'"')" \
    "$kind" "$status" "${esc_error:-null}" >> "$JSON_OUT"

done < "$OUT_DIR/.json_files_${TS}.list"

echo "]}" >> "$JSON_OUT"

printf "\nReports saved to:\n- %s\n- %s\n" "$TXT_OUT" "$JSON_OUT" | tee -a "$TXT_OUT"
