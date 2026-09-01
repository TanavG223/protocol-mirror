#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_video="$project_dir/docs/demo/protocol-mirror-demo.mp4"
benchmark_image="$project_dir/docs/screenshots/07-real-world-benchmark.png"
title_image="$project_dir/docs/demo/title-card.png"
asset_dir="$project_dir/docs/demo/edit-assets"
voice_input="${NARRATION_AUDIO:-}"
voice_tempo="${VOICE_TEMPO:-1.095}"
output_video="${OUTPUT_VIDEO:-$project_dir/docs/demo/protocol-mirror-submission-demo.mp4}"
output_voice="${OUTPUT_VOICE:-$project_dir/docs/demo/protocol-mirror-submission-voiceover.m4a}"
render_tmp="$(mktemp -d /tmp/protocol-mirror-benchmark-demo.XXXXXX)"
trap 'rm -rf "$render_tmp"' EXIT

if [[ -z "$voice_input" || ! -f "$voice_input" ]]; then
  printf '%s\n' 'Release render refused: set NARRATION_AUDIO to an owner-approved, rights-cleared narration file.' >&2
  exit 1
fi

for required in "$source_video" "$benchmark_image" "$title_image"; do
  [[ -f "$required" ]] || { printf 'Missing required asset: %s\n' "$required" >&2; exit 1; }
done

for overlay in "$asset_dir"/*.svg; do
  sips -s format png "$overlay" --out "$render_tmp/$(basename "${overlay%.svg}").png" >/dev/null
done

ffmpeg -hide_banner -loglevel error -y \
  -i "$voice_input" \
  -af "atempo=$voice_tempo,highpass=f=70,lowpass=f=12000,acompressor=threshold=-18dB:ratio=2.4:attack=18:release=180,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -ac 2 -c:a aac -b:a 192k "$output_voice"

ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -t 7.0 -i "$title_image" \
  -loop 1 -t 24.0 -i "$benchmark_image" \
  -ss 67.0 -t 11.0 -i "$source_video" \
  -ss 54.0 -t 14.0 -i "$source_video" \
  -ss 42.0 -t 14.0 -i "$source_video" \
  -ss 0.0 -t 14.0 -i "$source_video" \
  -ss 12.0 -t 14.0 -i "$source_video" \
  -ss 24.0 -t 12.0 -i "$source_video" \
  -loop 1 -t 8.5 -i "$title_image" \
  -i "$render_tmp/01-hero-overlay.png" \
  -i "$render_tmp/02-evidence-overlay.png" \
  -i "$render_tmp/03-proposal-overlay.png" \
  -i "$render_tmp/04-human-overlay.png" \
  -i "$render_tmp/05-receipt-overlay.png" \
  -i "$render_tmp/06-live-overlay.png" \
  -i "$render_tmp/00-six-tools-badge.png" \
  -i "$output_voice" \
  -filter_complex "
    [0:v]scale=1280:720:flags=lanczos,setsar=1,zoompan=z='min(zoom+0.00020,1.025)':d=420:s=1280x720:fps=60,trim=duration=7.0,setpts=PTS-STARTPTS[v0];
    [1:v]scale=1280:720:flags=lanczos,setsar=1,zoompan=z='min(zoom+0.000014,1.020)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1440:s=1280x720:fps=60,trim=duration=24.0,setpts=PTS-STARTPTS[v1];
    [2:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v2base];[v2base][9:v]overlay=0:0:format=auto[v2label];[v2label][15:v]overlay=0:0:format=auto[v2];
    [3:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v3base];[v3base][10:v]overlay=0:0:format=auto[v3label];[v3label][15:v]overlay=0:0:format=auto[v3];
    [4:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v4base];[v4base][11:v]overlay=0:0:format=auto[v4label];[v4label][15:v]overlay=0:0:format=auto[v4];
    [5:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v5base];[v5base][12:v]overlay=0:0:format=auto[v5];
    [6:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v6base];[v6base][13:v]overlay=0:0:format=auto[v6];
    [7:v]scale=1280:720:flags=lanczos,setsar=1,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS-STARTPTS[v7base];[v7base][14:v]overlay=0:0:format=auto[v7];
    [8:v]scale=1280:720:flags=lanczos,setsar=1,zoompan=z='min(zoom+0.00018,1.025)':d=510:s=1280x720:fps=60,trim=duration=8.5,setpts=PTS-STARTPTS[v8];
    [v0][v1]xfade=transition=fade:duration=0.65:offset=6.35[x1];
    [x1][v2]xfade=transition=smoothleft:duration=0.65:offset=29.70[x2];
    [x2][v3]xfade=transition=fade:duration=0.65:offset=40.05[x3];
    [x3][v4]xfade=transition=smoothup:duration=0.65:offset=53.40[x4];
    [x4][v5]xfade=transition=fade:duration=0.65:offset=66.75[x5];
    [x5][v6]xfade=transition=smoothleft:duration=0.65:offset=80.10[x6];
    [x6][v7]xfade=transition=fade:duration=0.65:offset=93.45[x7];
    [x7][v8]xfade=transition=fade:duration=0.65:offset=104.80[vout]
  " \
  -map "[vout]" -map 16:a -shortest \
  -c:v libx264 -preset slow -crf 14 -tune animation -profile:v high -level 4.2 \
  -pix_fmt yuv420p -r 60 -g 120 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  "$output_video"

printf 'Rendered %s\n' "$output_video"
printf 'Processed narration %s\n' "$output_voice"
