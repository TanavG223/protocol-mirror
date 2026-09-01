#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

output_bundle="${OUTPUT_BUNDLE:-$project_dir/../Protocol-Mirror-Submission-Bundle.zip}"
bundle_tmp="$(mktemp -d /tmp/protocol-mirror-submission-bundle.XXXXXX)"
bundle_root="$bundle_tmp/Protocol-Mirror-Submission-Bundle"
trap 'rm -rf "$bundle_tmp"' EXIT

fail() {
  printf 'BUNDLE_FAIL: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null || fail "git is required"
command -v zip >/dev/null || fail "zip is required"
command -v unzip >/dev/null || fail "unzip is required"
[[ -z "$(git status --porcelain)" ]] || fail "working tree must be clean so the bundle maps to one commit"

npm run check:submission
npm run check:media

mkdir -p "$bundle_root/video" "$bundle_root/screenshots" "$bundle_root/submission"

cp docs/SUBMISSION_HANDOFF.md "$bundle_root/00_READ_ME_FIRST.md"
cp docs/demo/protocol-mirror-submission-demo.mp4 "$bundle_root/video/"
cp docs/demo/protocol-mirror-submission-captions.srt "$bundle_root/video/"
cp docs/demo/title-card.png "$bundle_root/video/"
cp docs/screenshots/01-hero.jpg "$bundle_root/screenshots/"
cp docs/screenshots/02-comparison.jpg "$bundle_root/screenshots/"
cp docs/screenshots/03-review-queue.jpg "$bundle_root/screenshots/"
cp docs/screenshots/04-evidence-drawer.jpg "$bundle_root/screenshots/"
cp docs/screenshots/05-mobile.jpg "$bundle_root/screenshots/"
cp docs/screenshots/06-agent-reviewed.png "$bundle_root/screenshots/"
cp docs/screenshots/07-real-world-benchmark.png "$bundle_root/screenshots/"
cp devpost-submission.md "$bundle_root/submission/"
cp docs/YOUTUBE_METADATA.md "$bundle_root/submission/"
cp docs/FINAL_OWNER_DEMO_SCRIPT.md "$bundle_root/submission/"
cp docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md "$bundle_root/submission/"
cp docs/RELEASE_RUNBOOK.md "$bundle_root/submission/"
cp docs/FINAL_RELEASE_MANIFEST.md "$bundle_root/submission/"
cp docs/demo/KOKORO_NARRATION_PROVENANCE.md "$bundle_root/submission/"
cp LICENSE "$bundle_root/submission/PROJECT_LICENSE.txt"

commit_sha="$(git rev-parse HEAD)"
printf 'Protocol Mirror submission handoff\nCOMMIT_SHA=%s\nPUBLIC_REPOSITORY=https://github.com/TanavG223/protocol-mirror\nPUBLIC_APPLICATION=https://protocol-mirror.vercel.app\nEXTERNAL_STATE=not_submitted_owner_approval_pending\n' "$commit_sha" > "$bundle_root/BUILD_INFO.txt"

(
  cd "$bundle_root"
  if command -v sha256sum >/dev/null; then
    find . -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS.txt
  else
    find . -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 shasum -a 256 > SHA256SUMS.txt
  fi
)

mkdir -p "$(dirname "$output_bundle")"
rm -f "$output_bundle"
(
  cd "$bundle_tmp"
  zip -X -q -r "$output_bundle" "$(basename "$bundle_root")"
)

unzip -tq "$output_bundle" >/dev/null || fail "archive integrity test failed"
printf 'SUBMISSION_BUNDLE=PASS\n'
printf 'OUTPUT=%s\n' "$output_bundle"
printf 'COMMIT_SHA=%s\n' "$commit_sha"
printf 'FILES=%s\n' "$(unzip -Z1 "$output_bundle" | grep -v '/$' | wc -l | tr -d ' ')"
printf 'SHA256=%s\n' "$(shasum -a 256 "$output_bundle" | awk '{print $1}')"
