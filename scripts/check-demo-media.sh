#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

video="docs/demo/protocol-mirror-submission-demo.mp4"
voice="docs/demo/protocol-mirror-submission-voiceover.m4a"
source_voice="docs/demo/protocol-mirror-kokoro-source.wav"
captions="docs/demo/protocol-mirror-submission-captions.srt"

fail() {
  printf 'MEDIA_CHECK_FAIL: %s\n' "$*" >&2
  exit 1
}

for command in ffmpeg ffprobe; do
  command -v "$command" >/dev/null || fail "$command is required"
done

for file in "$video" "$voice" "$source_voice" "$captions"; do
  [[ -f "$file" ]] || fail "missing $file"
done

sha256() {
  if command -v sha256sum >/dev/null; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

[[ "$(sha256 "$video")" == "c39f2720d788b7ae60c7553174bf003a92af6c971219986d41aa4126a5a9d10f" ]] || fail "video checksum changed"
[[ "$(sha256 "$voice")" == "4fc5bd5469c88f3f93a028fd974e72f246a004a6ee93c79659d164a04012d12a" ]] || fail "processed narration checksum changed"
[[ "$(sha256 "$source_voice")" == "feb90ecf25cd785f78f40faee612947e79a95aa5d3c6288ea08daf607fa730e0" ]] || fail "source narration checksum changed"
[[ "$(sha256 "$captions")" == "acdac92ee20705ec4b1d9ce584c1c204e688f802ebc48606e885232846a7f4e4" ]] || fail "caption checksum changed"

duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$video")"
awk -v duration="$duration" 'BEGIN { exit !(duration >= 113.29 && duration <= 113.31) }' || fail "duration is $duration instead of 113.30 seconds"

video_contract="$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=codec_name,width,height,avg_frame_rate,nb_read_frames -of csv=p=0 "$video")"
[[ "$video_contract" == "h264,1280,720,60/1,6798" ]] || fail "unexpected video contract: $video_contract"

audio_contract="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 "$video")"
[[ "$audio_contract" == "aac,48000,2" ]] || fail "unexpected audio contract: $audio_contract"

analysis="$(ffmpeg -hide_banner -i "$video" -vf 'blackdetect=d=0.4:pix_th=0.10,vfrdet' -af 'silencedetect=n=-45dB:d=1.5' -f null - 2>&1)"
grep -q 'VFR:0.000000' <<<"$analysis" || fail "constant-frame-rate proof failed"
if grep -q 'black_start' <<<"$analysis"; then fail "black segment of at least 0.4 seconds detected"; fi
if grep -q 'silence_start' <<<"$analysis"; then fail "silence of at least 1.5 seconds detected"; fi

node - "$captions" <<'NODE'
const fs = require("node:fs");
const captions = fs.readFileSync(process.argv[2], "utf8");
const cues = [...captions.matchAll(/(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)/g)].map((match) =>
  [match.slice(1, 5), match.slice(5, 9)].map((time) => ((+time[0] * 60 + +time[1]) * 60 + +time[2]) * 1000 + +time[3]),
);
if (cues.length !== 23) throw new Error(`expected 23 caption cues; found ${cues.length}`);
for (let index = 0; index < cues.length; index += 1) {
  if (cues[index][1] <= cues[index][0]) throw new Error(`caption ${index + 1} has an invalid interval`);
  if (index && cues[index][0] < cues[index - 1][1]) throw new Error(`caption ${index + 1} overlaps its predecessor`);
}
if (cues.at(-1)[1] > 113300) throw new Error("captions extend beyond the video");
NODE

printf '%s\n' 'MEDIA_CHECK=PASS'
printf 'VIDEO_CONTRACT=%s\n' "$video_contract"
printf 'AUDIO_CONTRACT=%s\n' "$audio_contract"
printf 'DURATION_SECONDS=%s\n' "$duration"
printf '%s\n' 'CAPTIONS=23_monotonic_cues'
printf '%s\n' 'CONTINUITY=no_black_0.4s+no_silence_1.5s+constant_60fps'
