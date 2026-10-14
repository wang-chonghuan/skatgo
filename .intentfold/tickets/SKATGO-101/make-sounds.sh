#!/usr/bin/env bash
# SKATGO-101: the table's card sounds in app/public/sounds/ — the set the human chose from the trial ("2 · Kenney
# Leicht"): Kenney's lightest card sounds. Cut from Kenney's Casino Audio (CC0,
# https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips, kenney_casino-audio.zip): each is
# trimmed of silence at both ends, levelled to a mean loudness, limited, mono 44.1 kHz, MP3 64 kbit/s — the one
# format every browser decodes. Needs ffmpeg.
#   bash .intentfold/tickets/SKATGO-101/make-sounds.sh <unzipped Kenney pack>/Audio
set -euo pipefail
SRC=${1:?the Audio folder of the Kenney pack}
OUT=$(cd "$(dirname "$0")/../../.." && pwd)/app/public/sounds
mkdir -p "$OUT"
trim="silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
make() { # <source> <name> <target mean dB>
  local tmp; tmp=$(mktemp -t sound).wav
  ffmpeg -hide_banner -loglevel error -y -i "$SRC/$1.ogg" -ac 1 -ar 44100 -af "$trim" "$tmp"
  local mean; mean=$(ffmpeg -hide_banner -nostats -i "$tmp" -af volumedetect -f null - 2>&1 | awk '/mean_volume/ {print $5}')
  ffmpeg -hide_banner -loglevel error -y -i "$tmp" -af "volume=$(python3 -c "print(round($3-($mean),1))")dB,alimiter=limit=0.89" -c:a libmp3lame -b:a 64k "$OUT/$2.mp3"
  rm -f "$tmp"
}
make card-fan-1 deal -24
make card-place-1 play-1 -26; make card-place-2 play-2 -26; make card-place-3 play-3 -26
make card-slide-6 collect -28
cp "$SRC/../License.txt" "$OUT/LICENSE-kenney-casino-audio.txt"
