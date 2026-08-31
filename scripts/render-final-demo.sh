#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_video="$project_dir/docs/demo/protocol-mirror-demo.mp4"
narration="$project_dir/docs/demo/FINAL_VIDEO_NARRATION.txt"
asset_dir="$project_dir/docs/demo/edit-assets"
output_video="$project_dir/docs/demo/protocol-mirror-final-demo.mp4"
output_voice="$project_dir/docs/demo/protocol-mirror-final-voiceover.m4a"
render_tmp="$(mktemp -d /tmp/protocol-mirror-final-demo.XXXXXX)"
trap 'rm -rf "$render_tmp"' EXIT

render_overlay() {
  local source_svg="$1"
  local output_png="$2"
  sips -s format png "$source_svg" --out "$output_png" >/dev/null
}

for overlay in "$asset_dir"/*.svg; do
  render_overlay "$overlay" "$render_tmp/$(basename "${overlay%.svg}").png"
done

say -v "Reed (English (US))" -r 168 -f "$narration" -o "$render_tmp/voice.aiff"
ffmpeg -hide_banner -loglevel error -y \
  -i "$render_tmp/voice.aiff" \
  -af "highpass=f=70,lowpass=f=12000,acompressor=threshold=-18dB:ratio=2.4:attack=18:release=180,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -ac 2 -c:a aac -b:a 192k "$output_voice"

ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -t 6.5 -i "$project_dir/docs/demo/title-card.png" \
  -ss 67.0 -t 12.5 -i "$source_video" \
  -ss 54.0 -t 13.0 -i "$source_video" \
  -ss 42.0 -t 14.0 -i "$source_video" \
  -ss 0.0 -t 14.0 -i "$source_video" \
  -ss 12.0 -t 14.0 -i "$source_video" \
  -ss 24.0 -t 12.0 -i "$source_video" \
  -loop 1 -t 8.2 -i "$project_dir/docs/demo/title-card.png" \
  -i "$render_tmp/01-hero-overlay.png" \
  -i "$render_tmp/02-evidence-overlay.png" \
  -i "$render_tmp/03-proposal-overlay.png" \
  -i "$render_tmp/04-human-overlay.png" \
  -i "$render_tmp/05-receipt-overlay.png" \
  -i "$render_tmp/06-live-overlay.png" \
  -i "$render_tmp/00-six-tools-badge.png" \
  -i "$output_voice" \
  -filter_complex "
    [0:v]scale=1280:720,setsar=1,fps=30,zoompan=z='min(zoom+0.00045,1.035)':d=195:s=1280x720:fps=30,trim=duration=6.5,setpts=PTS-STARTPTS[v0];
    [1:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v1base];[v1base][8:v]overlay=0:0:format=auto[v1label];[v1label][14:v]overlay=0:0:format=auto[v1];
    [2:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v2base];[v2base][9:v]overlay=0:0:format=auto[v2label];[v2label][14:v]overlay=0:0:format=auto[v2];
    [3:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v3base];[v3base][10:v]overlay=0:0:format=auto[v3label];[v3label][14:v]overlay=0:0:format=auto[v3];
    [4:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v4base];[v4base][11:v]overlay=0:0:format=auto[v4];
    [5:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v5base];[v5base][12:v]overlay=0:0:format=auto[v5];
    [6:v]scale=1280:720,setsar=1,fps=30,setpts=PTS-STARTPTS[v6base];[v6base][13:v]overlay=0:0:format=auto[v6];
    [7:v]scale=1280:720,setsar=1,fps=30,zoompan=z='min(zoom+0.0005,1.04)':d=246:s=1280x720:fps=30,trim=duration=8.2,setpts=PTS-STARTPTS[v7];
    [v0][v1]xfade=transition=fade:duration=0.65:offset=5.85[x1];
    [x1][v2]xfade=transition=smoothleft:duration=0.65:offset=17.70[x2];
    [x2][v3]xfade=transition=fade:duration=0.65:offset=30.05[x3];
    [x3][v4]xfade=transition=smoothup:duration=0.65:offset=43.40[x4];
    [x4][v5]xfade=transition=fade:duration=0.65:offset=56.75[x5];
    [x5][v6]xfade=transition=smoothleft:duration=0.65:offset=70.10[x6];
    [x6][v7]xfade=transition=fade:duration=0.65:offset=81.45[vout]
  " \
  -map "[vout]" -map 15:a \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  "$output_video"

printf 'Rendered %s\n' "$output_video"
