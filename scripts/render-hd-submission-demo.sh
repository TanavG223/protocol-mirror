#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
capture_dir="$project_dir/docs/demo/hd-captures"
asset_dir="$project_dir/docs/demo/edit-assets"
stage_svg="$asset_dir/hd-stage.svg"
captions="$project_dir/docs/demo/protocol-mirror-submission-captions.srt"
voice_input="${NARRATION_AUDIO:-}"
voice_tempo="${VOICE_TEMPO:-1.095}"
output_video="${OUTPUT_VIDEO:-$project_dir/docs/demo/protocol-mirror-submission-demo.mp4}"
output_voice="${OUTPUT_VOICE:-$project_dir/docs/demo/protocol-mirror-submission-voiceover.m4a}"
render_tmp="$(mktemp -d /tmp/protocol-mirror-hd-demo.XXXXXX)"
trap 'rm -rf "$render_tmp"' EXIT

if [[ -z "$voice_input" || ! -f "$voice_input" ]]; then
  printf '%s\n' 'Release render refused: set NARRATION_AUDIO to an owner-approved, rights-cleared narration file.' >&2
  exit 1
fi

for command in ffmpeg ffprobe sips; do
  command -v "$command" >/dev/null || { printf 'Missing required command: %s\n' "$command" >&2; exit 1; }
done

for required in "$stage_svg" "$captions" \
  "$capture_dir/01-hero.jpg" "$capture_dir/02-benchmark.jpg" \
  "$capture_dir/03-evidence-table.jpg" "$capture_dir/04-human-review.jpg" \
  "$capture_dir/05-evidence-drawer.jpg" "$capture_dir/06-reviewed-receipt.jpg" \
  "$capture_dir/07-seven-tools.jpg" "$capture_dir/08-live-sources.jpg"; do
  [[ -f "$required" ]] || { printf 'Missing required asset: %s\n' "$required" >&2; exit 1; }
done

capture_hashes=()
for capture in "$capture_dir"/0[1-8]-*.jpg; do
  IFS=, read -r capture_width capture_height < <(
    ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$capture"
  )
  if (( capture_width < 1920 || capture_height < 1080 || capture_width * 9 != capture_height * 16 )); then
    printf 'Capture must be 16:9 and at least 1920x1080: %s is %sx%s\n' "$capture" "$capture_width" "$capture_height" >&2
    exit 1
  fi
  if command -v sha256sum >/dev/null; then
    capture_hashes+=("$(sha256sum "$capture" | awk '{print $1}')")
  else
    capture_hashes+=("$(shasum -a 256 "$capture" | awk '{print $1}')")
  fi
done

if [[ "$(printf '%s\n' "${capture_hashes[@]}" | sort -u | wc -l | tr -d ' ')" != "8" ]]; then
  printf '%s\n' 'Release render refused: the eight capture files must be visually distinct source frames.' >&2
  exit 1
fi

sips -s format png "$stage_svg" --out "$render_tmp/stage.png" >/dev/null
for overlay in "$asset_dir"/0[1-6]-*.svg; do
  sips -s format png -z 2160 3840 "$overlay" --out "$render_tmp/$(basename "${overlay%.svg}").png" >/dev/null
done

render_scene() {
  local source_image="$1"
  local scene_name="$2"
  local overlay_name="${3:-}"
  local overlay_filter="[framed]null[out]"
  local inputs=(-i "$render_tmp/stage.png" -i "$source_image")

  if [[ -n "$overlay_name" ]]; then
    inputs+=(-i "$render_tmp/$overlay_name.png")
    overlay_filter="[framed][2:v]overlay=0:0:format=auto[out]"
  fi

  ffmpeg -hide_banner -loglevel error -y \
    "${inputs[@]}" \
    -filter_complex "
      [0:v]scale=3840:2160:flags=lanczos,format=rgba[stage];
      [1:v]scale=3360:1890:force_original_aspect_ratio=decrease:flags=lanczos,
        pad=3360:1890:(ow-iw)/2:(oh-ih)/2:color=#fbfaf6,format=rgba[app];
      [app]split=2[appmain][shadowbase];
      [shadowbase]colorchannelmixer=rr=0:gg=0:bb=0:aa=.50,boxblur=44:20[shadow];
      [stage][shadow]overlay=250:166:format=auto[shadowed];
      [shadowed][appmain]overlay=240:136:format=auto,
        drawbox=x=238:y=134:w=3364:h=1894:color=#d7e5ff@.66:t=4[framed];
      $overlay_filter
    " \
    -map "[out]" -frames:v 1 "$render_tmp/$scene_name.png"
}

render_scene "$capture_dir/01-hero.jpg" "hero-clean"
render_scene "$capture_dir/01-hero.jpg" "hero-close" "01-hero-overlay"
render_scene "$capture_dir/02-benchmark.jpg" "benchmark"
render_scene "$capture_dir/03-evidence-table.jpg" "evidence-tools" "02-evidence-overlay"
render_scene "$capture_dir/05-evidence-drawer.jpg" "evidence-proposal" "03-proposal-overlay"
render_scene "$capture_dir/04-human-review.jpg" "review-human" "04-human-overlay"
render_scene "$capture_dir/07-seven-tools.jpg" "seven-tools" "05-receipt-overlay"
render_scene "$capture_dir/06-reviewed-receipt.jpg" "reviewed-receipt" "05-receipt-overlay"
render_scene "$capture_dir/08-live-sources.jpg" "live-sources" "06-live-overlay"

if [[ "${PROOF_ONLY:-0}" == "1" ]]; then
  proof_video="${PROOF_VIDEO:-$render_tmp/transition-proof.mp4}"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$render_tmp/hero-clean.png" \
    -i "$render_tmp/benchmark.png" \
    -i "$render_tmp/evidence-tools.png" \
    -filter_complex "
      [0:v]zoompan=z='1+.01*on/119':d=120:s=1280x720:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v0];
      [1:v]zoompan=z='1+.01*on/119':d=120:s=1280x720:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v1];
      [2:v]zoompan=z='1+.01*on/119':d=120:s=1280x720:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v2];
      [v0][v1]xfade=transition=fade:duration=0.5:offset=1.5[x1];
      [x1][v2]xfade=transition=fade:duration=0.5:offset=3.0[vout]
    " \
    -map "[vout]" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 60 -fps_mode cfr "$proof_video"
  printf 'Rendered transition proof %s\n' "$proof_video"
  exit 0
fi

ffmpeg -hide_banner -loglevel error -y \
  -i "$voice_input" \
  -af "atempo=$voice_tempo,highpass=f=70,lowpass=f=12000,acompressor=threshold=-18dB:ratio=2.4:attack=18:release=180,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -ac 2 -c:a aac -b:a 192k "$output_voice"

ffmpeg -hide_banner -loglevel error -y \
  -i "$render_tmp/hero-clean.png" \
  -i "$render_tmp/benchmark.png" \
  -i "$render_tmp/benchmark.png" \
  -i "$render_tmp/benchmark.png" \
  -i "$render_tmp/evidence-tools.png" \
  -i "$render_tmp/evidence-proposal.png" \
  -i "$render_tmp/review-human.png" \
  -i "$render_tmp/seven-tools.png" \
  -i "$render_tmp/reviewed-receipt.png" \
  -i "$render_tmp/live-sources.png" \
  -i "$render_tmp/benchmark.png" \
  -i "$render_tmp/hero-close.png" \
  -i "$output_voice" \
  -filter_complex "
    [0:v]zoompan=z='1+.025*(.5-.5*cos(PI*on/539))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=540:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v0];
    [1:v]zoompan=z='1+.035*(.5-.5*cos(PI*on/809))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=810:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v1];
    [2:v]zoompan=z='1.04+.10*(.5-.5*cos(PI*on/809))':x='(iw-iw/zoom)*.18':y='(ih-ih/zoom)*.58':d=810:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v2];
    [3:v]zoompan=z='1.04+.10*(.5-.5*cos(PI*on/809))':x='(iw-iw/zoom)*.82':y='(ih-ih/zoom)*.58':d=810:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v3];
    [4:v]zoompan=z='1.01+.075*(.5-.5*cos(PI*on/539))':x='(iw-iw/zoom)*.48':y='(ih-ih/zoom)*.52':d=540:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v4];
    [5:v]zoompan=z='1.01+.085*(.5-.5*cos(PI*on/539))':x='(iw-iw/zoom)*.56':y='(ih-ih/zoom)*.72':d=540:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v5];
    [6:v]zoompan=z='1.01+.08*(.5-.5*cos(PI*on/539))':x='(iw-iw/zoom)*.58':y='(ih-ih/zoom)*.46':d=540:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v6];
    [7:v]zoompan=z='1.01+.085*(.5-.5*cos(PI*on/419))':x='(iw-iw/zoom)*.84':y='(ih-ih/zoom)*.16':d=420:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v7];
    [8:v]zoompan=z='1.01+.08*(.5-.5*cos(PI*on/539))':x='(iw-iw/zoom)*.56':y='(ih-ih/zoom)*.56':d=540:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v8];
    [9:v]zoompan=z='1.01+.07*(.5-.5*cos(PI*on/809))':x='(iw-iw/zoom)*.50':y='(ih-ih/zoom)*.38':d=810:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v9];
    [10:v]zoompan=z='1.075-.05*(.5-.5*cos(PI*on/419))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=420:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v10];
    [11:v]zoompan=z='1.065-.055*(.5-.5*cos(PI*on/512))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=513:s=1920x1080:fps=60,format=yuv420p,setpts=PTS-STARTPTS[v11];
    [v0][v1]xfade=transition=fade:duration=0.75:offset=8.25[x1];
    [x1][v2]xfade=transition=smoothleft:duration=0.75:offset=21.00[x2];
    [x2][v3]xfade=transition=smoothright:duration=0.75:offset=33.75[x3];
    [x3][v4]xfade=transition=fade:duration=0.75:offset=46.50[x4];
    [x4][v5]xfade=transition=smoothup:duration=0.75:offset=54.75[x5];
    [x5][v6]xfade=transition=fade:duration=0.75:offset=63.00[x6];
    [x6][v7]xfade=transition=smoothleft:duration=0.75:offset=71.25[x7];
    [x7][v8]xfade=transition=fade:duration=0.75:offset=77.50[x8];
    [x8][v9]xfade=transition=smoothup:duration=0.75:offset=85.75[x9];
    [x9][v10]xfade=transition=fade:duration=0.75:offset=98.50[x10];
    [x10][v11]xfade=transition=fade:duration=0.75:offset=104.75[vout]
  " \
  -map "[vout]" -map 12:a -shortest \
  -c:v libx264 -preset medium -crf 14 -tune animation -profile:v high -level 4.2 \
  -pix_fmt yuv420p -r 60 -fps_mode cfr -g 120 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  "$output_video"

printf 'Rendered %s\n' "$output_video"
printf 'Processed narration %s\n' "$output_voice"
