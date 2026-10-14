#!/usr/bin/env bash
# SKATGO-101: the table's card sounds in app/public/sounds/, cut from Kenney's Casino Audio (CC0,
# https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips, kenney_casino-audio.zip).
# Each is trimmed of silence at both ends, levelled to about -24 dB mean (play-1 to -23, from its trimmed
# length), limited, mono 44.1 kHz, MP3 64 kbit/s — the one format every browser decodes. Needs ffmpeg.
#   bash .intentfold/tickets/SKATGO-101/make-sounds.sh <unzipped Kenney pack>/Audio [<folder of BMacZero's WAVs>]
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
make card-fan-1 deal-1 -24; make card-fan-2 deal-2 -24
make card-slide-5 play-1 -23; make card-slide-2 play-2 -24; make card-slide-3 play-3 -24; make card-slide-4 play-4 -24
make card-shove-3 collect-1 -24; make card-shove-4 collect-2 -24
cp "$SRC/../License.txt" "$OUT/LICENSE-kenney-casino-audio.txt"
# Kenney's lighter card sounds, for the trial sets (SKATGO-101: 「这个好像太沉重」).
make card-place-1 place-1 -26; make card-place-2 place-2 -26; make card-place-3 place-3 -26; make card-place-4 place-4 -26
make card-slide-6 slide-soft -28
# BMacZero's Playing Card Sounds (CC0, https://opengameart.org/node/118338): WAV files, a second argument.
BMAC=${2:-}
if [ -n "$BMAC" ]; then
  wav() { # <source> <name> <target mean dB>
    local tmp; tmp=$(mktemp -t sound).wav
    ffmpeg -hide_banner -loglevel error -y -i "$BMAC/$1.wav" -ac 1 -ar 44100 -af "$trim" "$tmp"
    local mean; mean=$(ffmpeg -hide_banner -nostats -i "$tmp" -af volumedetect -f null - 2>&1 | awk '/mean_volume/ {print $5}')
    ffmpeg -hide_banner -loglevel error -y -i "$tmp" -af "volume=$(python3 -c "print(round($3-($mean),1))")dB,alimiter=limit=0.89" -c:a libmp3lame -b:a 64k "$OUT/$2.mp3"
    rm -f "$tmp"
  }
  wav shuffle bmac-deal -26; wav contact1 bmac-play-1 -24; wav contact2 bmac-play-2 -26; wav cut bmac-collect -26
fi
