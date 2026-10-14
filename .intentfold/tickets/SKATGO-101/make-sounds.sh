#!/usr/bin/env bash
# SKATGO-101: the table's card sounds in app/public/sounds/, cut from Kenney's Casino Audio (CC0,
# https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips, kenney_casino-audio.zip).
# Each is trimmed of silence at both ends, levelled to about -24 dB mean (play-1 to -23, from its trimmed
# length), limited, mono 44.1 kHz, MP3 64 kbit/s — the one format every browser decodes. Needs ffmpeg.
#   bash .intentfold/tickets/SKATGO-101/make-sounds.sh <unzipped pack>/Audio
set -euo pipefail
SRC=${1:?the pack's Audio folder}
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
make card-fan-1 deal-1 -24; make card-fan-2 deal-2 -24
make card-slide-5 play-1 -23; make card-slide-2 play-2 -24; make card-slide-3 play-3 -24; make card-slide-4 play-4 -24
make card-shove-3 collect-1 -24; make card-shove-4 collect-2 -24
cp "$SRC/../License.txt" "$OUT/LICENSE-kenney-casino-audio.txt"
