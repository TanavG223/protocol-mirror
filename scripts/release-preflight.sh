#!/usr/bin/env bash
set -euo pipefail

preflight_mode="${1:-product}"
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

fail() {
  echo "PREFLIGHT_FAIL: $*" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "required file is missing: $1"
}

[[ "$preflight_mode" == "product" || "$preflight_mode" == "submission" ]] || fail "mode must be product or submission"
command -v git >/dev/null || fail "git is required"
command -v node >/dev/null || fail "Node.js is required"
command -v npm >/dev/null || fail "npm is required"

require_file package.json
require_file package-lock.json
require_file LICENSE
require_file README.md
require_file devpost-submission.md
require_file docs/OFFICIAL_REQUIREMENTS_SNAPSHOT.md
require_file docs/JUDGE_SCORECARD.md
require_file docs/BROWSER_VERIFICATION.md
require_file docs/FINAL_OWNER_DEMO_SCRIPT.md
require_file docs/demo/BENCHMARK_RECUT_NARRATION.txt
require_file docs/demo/BENCHMARK_RECUT_STORYBOARD.md
require_file benchmarks/README.md
require_file benchmarks/real-world-pairs.json
require_file benchmarks/runs/live-source-webmcp-2026-08-31.json
require_file benchmarks/runs/qwen3-4b-2026-08-31.json
require_file benchmarks/runs/ornith-1-5-9b-2026-08-31.json
require_file docs/demo/protocol-mirror-final-demo.mp4
require_file docs/demo/protocol-mirror-final-captions.srt
require_file docs/demo/title-card.png

for screenshot in docs/screenshots/01-hero.jpg docs/screenshots/02-comparison.jpg docs/screenshots/03-review-queue.jpg docs/screenshots/04-evidence-drawer.jpg docs/screenshots/05-mobile.jpg docs/screenshots/06-agent-reviewed.png docs/screenshots/07-real-world-benchmark.png; do
  require_file "$screenshot"
done

repo_root="$(git rev-parse --show-toplevel)"
[[ "$repo_root" == "$project_dir" ]] || fail "run this command from the Protocol Mirror repository"
[[ -z "$(git status --porcelain)" ]] || fail "working tree must be clean so the evidence maps to one commit"
git diff --check HEAD^ HEAD

node -e '
  const pkg = require("./package.json");
  const lock = require("./package-lock.json");
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (pkg.name !== "protocol-mirror") throw new Error("unexpected package name");
  if (lock.name !== pkg.name || lock.version !== pkg.version) throw new Error("package and lockfile identity differ");
  if (!pkg.engines?.node) throw new Error("package.json must declare the supported Node.js range");
  if (major < 20 || (major === 20 && minor < 9)) throw new Error("Node.js 20.9 or newer is required");
' || fail "package and lockfile contract failed"

tracked_sensitive_files="$(git ls-files | grep -E '(^|/)\.env($|\.)|\.(pem|key)$' || true)"
[[ -z "$tracked_sensitive_files" ]] || fail "credential-shaped files are tracked: $tracked_sensitive_files"

grep -q 'document.modelContext' src/app/workspace.tsx || fail "top-level WebMCP context usage is missing"
grep -q 'registerTool' src/app/workspace.tsx || fail "WebMCP tool registration is missing"
grep -q 'export_review_receipt' src/app/workspace.tsx || fail "dynamic reviewed-receipt tool is missing"
grep -q 'Agent packages proof' src/app/workspace.tsx || fail "four-step agent collaboration loop is missing"
grep -q 'MIT' LICENSE || fail "detectable MIT license text is missing"

npm ci
npm audit --omit=dev --audit-level=high
npm run check

commit_sha="$(git rev-parse HEAD)"
echo "PRODUCT_PREFLIGHT=PASS"
echo "COMMIT_SHA=$commit_sha"
echo "TEST_CONTRACT=clean-install+lint+tests+typescript+production-build+high-severity-audit"

if [[ "$preflight_mode" == "submission" ]]; then
  [[ "${PROTOCOL_MIRROR_RULES_ACKNOWLEDGED:-}" == "yes" ]] || fail "set PROTOCOL_MIRROR_RULES_ACKNOWLEDGED=yes only after the owner accepts the current official rules"
  [[ "${PROTOCOL_MIRROR_MEDIA_APPROVED:-}" == "yes" ]] || fail "set PROTOCOL_MIRROR_MEDIA_APPROVED=yes only after narration rights and the complete media watch are confirmed"
  [[ "${PROTOCOL_MIRROR_PERSONAL_FIELDS_CONFIRMED:-}" == "yes" ]] || fail "set PROTOCOL_MIRROR_PERSONAL_FIELDS_CONFIRMED=yes only after the owner confirms the personal Devpost fields"
  [[ "${PROTOCOL_MIRROR_PUBLIC_VIDEO_URL:-}" =~ ^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]+ ]] || fail "set PROTOCOL_MIRROR_PUBLIC_VIDEO_URL to the watched public YouTube demo"
  echo "SUBMISSION_PREFLIGHT=PASS"
fi
