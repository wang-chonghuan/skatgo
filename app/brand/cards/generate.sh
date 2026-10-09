#!/usr/bin/env bash
# Generates one card image with the Azure OpenAI image model (SKATGO-66): the prompt is the shared style,
# then the format for its kind, then the image's own subject. Every call is logged in calls.log; the
# helper writes <name>.png.json beside the master with the prompt, parameters and the PNG's SHA-256 (no
# credential).
#
#   app/brand/cards/generate.sh <name> <kind: court-top|full|symbol|back> [reference.png ...]
#
# The helper is n-azure's generate_image.py (direct Azure call; key from the local credential file).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
helper="${N_AZURE_IMAGE:-$HOME/.claude/skills/n-azure/scripts/generate_image.py}"
name="$1"; kind="$2"; shift 2
case "$kind" in
  court-top) size=1536x1024; format="$here/prompts/_court-top.txt" ;;
  full|back) size=1024x1536; format="$here/prompts/_$kind.txt" ;;
  symbol) size=1024x1024; format="$here/prompts/_symbol.txt" ;;
  *) echo "unknown kind $kind" >&2; exit 2 ;;
esac
prompt="$(mktemp)"
{ cat "$here/prompts/_style.txt"; echo; cat "$format"; echo; cat "$here/prompts/$name.txt"; } > "$prompt"
refs=()
for r in "$@"; do refs+=(--reference-image "$r"); done
# A back is a whole opaque face; everything else lies on the card's white.
background=transparent; [ "$kind" = back ] && background=opaque
status=ok
python3 "$helper" --prompt-file "$prompt" --output "$here/masters/$name.png" --size "$size" --quality high \
  --background "$background" --retries 0 --force ${refs[@]+"${refs[@]}"} >/dev/null || status=failed
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $name $kind $size high refs=$# $status" >> "$here/calls.log"
# The master is kept as lossless WebP (pixel for pixel the model's PNG, `-exact`); the PNG itself stays on
# this machine, outside git, in the repository's ignored .intentfold/tmp/card-masters-png/.
if [ "$status" = ok ]; then
  png_dir="$here/../../../.intentfold/tmp/card-masters-png"; mkdir -p "$png_dir"
  cwebp -quiet -lossless -exact -z 6 "$here/masters/$name.png" -o "$here/masters/$name.webp"
  mv -f "$here/masters/$name.png" "$png_dir/$name.png"
fi
rm -f "$prompt"
[ "$status" = ok ]
