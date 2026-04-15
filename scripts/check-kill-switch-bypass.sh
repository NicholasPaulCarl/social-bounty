#!/usr/bin/env bash
#
# check-kill-switch-bypass.sh
#
# CI guard for the Financial Kill Switch bypass flag
# (`allowDuringKillSwitch: true`). The flag is authorised ONLY in
# `apps/api/src/modules/finance-admin/finance-admin.service.ts` per
# ADR 0006 (docs/adr/0006-compensating-entries-bypass-kill-switch.md).
#
# Any other occurrence in production source code is a policy violation
# and must be reviewed + blocked before merge.
#
# Exclusions (by design, not by accident):
#   - *.spec.ts / *.test.ts — test files exercise the bypass to verify
#     ADR 0006 behaviour; they add no new callers.
#   - docs/adr/0006-…md and docs/reviews/** — audit notes and the ADR
#     itself discuss the flag in prose.
#   - docs/contributing.md / CONTRIBUTING.md — documents this guard
#     and necessarily quotes the flag name.
#   - this script — quotes the pattern it searches for.
# Any new real caller of `allowDuringKillSwitch: true` in production
# source code will be caught.
#
# Usage:   bash scripts/check-kill-switch-bypass.sh
# Exits:   0 when no violations found
#          1 when one or more violations are detected
#          2 when no search backend (rg/grep) is available
#
# This script intentionally has zero dependencies beyond POSIX tools
# + (optionally) ripgrep, so it runs anywhere CI and devs can land.

set -euo pipefail

# Resolve repo root relative to this script's location so the check
# works no matter where it's invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# The ONE allowed file per ADR 0006.
ALLOWED_FILE="apps/api/src/modules/finance-admin/finance-admin.service.ts"

# Pattern to search for. We look for the exact literal flag assignment
# `allowDuringKillSwitch: true`. The TypeScript interface declaration
# itself (`allowDuringKillSwitch?: boolean`) and tests that reference
# the flag name are NOT matched by this pattern.
PATTERN='allowDuringKillSwitch: true'

# Directories/files we don't search (build output, deps, etc.).
EXCLUDE_GLOBS=(
  ':(exclude)node_modules'
  ':(exclude)**/node_modules'
  ':(exclude)**/dist'
  ':(exclude)**/.next'
  ':(exclude)**/coverage'
  ':(exclude)scripts/check-kill-switch-bypass.sh'
  ':(exclude)docs/adr/0006-compensating-entries-bypass-kill-switch.md'
  ':(exclude)docs/reviews/**'
  ':(exclude)package.json'
  ':(exclude)package-lock.json'
)

# Prefer ripgrep if available (faster + honours .gitignore),
# otherwise fall back to plain grep.
MATCHES=""
if command -v rg >/dev/null 2>&1; then
  # -F fixed string, -n line numbers, --hidden don't skip dotfiles
  # --glob exclusions for noisy dirs + self + reference docs.
  set +e
  MATCHES="$(rg -F -n --hidden \
    --glob '!node_modules' \
    --glob '!**/node_modules/**' \
    --glob '!**/dist/**' \
    --glob '!**/.next/**' \
    --glob '!**/coverage/**' \
    --glob '!scripts/check-kill-switch-bypass.sh' \
    --glob '!docs/adr/0006-compensating-entries-bypass-kill-switch.md' \
    --glob '!docs/reviews/**' \
    --glob '!package.json' \
    --glob '!package-lock.json' \
    --glob '!**/*.spec.ts' \
    --glob '!**/*.test.ts' \
    --glob '!docs/contributing.md' \
    --glob '!CONTRIBUTING.md' \
    "${PATTERN}" . || true)"
  set -e
elif command -v grep >/dev/null 2>&1; then
  set +e
  MATCHES="$(grep -R -F -n \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.next \
    --exclude-dir=coverage \
    --exclude-dir=.git \
    --exclude='check-kill-switch-bypass.sh' \
    --exclude='0006-compensating-entries-bypass-kill-switch.md' \
    --exclude='package.json' \
    --exclude='package-lock.json' \
    --exclude='*.spec.ts' \
    --exclude='*.test.ts' \
    --exclude='contributing.md' \
    --exclude='CONTRIBUTING.md' \
    "${PATTERN}" . || true)"
  set -e
else
  echo "ERROR: neither 'rg' nor 'grep' is available on PATH." >&2
  exit 2
fi

# Filter out lines that come from the allowed file.
VIOLATIONS=""
if [ -n "${MATCHES}" ]; then
  # The allowed path may appear as `./apps/...` (grep) or `apps/...` (rg).
  VIOLATIONS="$(printf '%s\n' "${MATCHES}" \
    | grep -v -E "(^|/)${ALLOWED_FILE}:" \
    || true)"
fi

# Also filter out review/audit docs that merely reference the flag name
# in prose (not a real assignment). This is defence-in-depth because
# the glob/exclude flags above already skip docs/reviews and the ADR.
if [ -n "${VIOLATIONS}" ]; then
  VIOLATIONS="$(printf '%s\n' "${VIOLATIONS}" \
    | grep -v '/docs/reviews/' \
    | grep -v '/docs/adr/0006-compensating-entries-bypass-kill-switch.md' \
    | grep -v '/docs/contributing.md' \
    | grep -v '/CONTRIBUTING.md' \
    || true)"
fi

if [ -z "${VIOLATIONS}" ]; then
  echo "OK: 'allowDuringKillSwitch: true' only appears in ${ALLOWED_FILE} (per ADR 0006)."
  exit 0
fi

echo "VIOLATION: 'allowDuringKillSwitch: true' found outside ${ALLOWED_FILE}."
echo ""
echo "The Financial Kill Switch bypass is authorised ONLY in:"
echo "  ${ALLOWED_FILE}"
echo ""
echo "See: docs/adr/0006-compensating-entries-bypass-kill-switch.md"
echo ""
echo "Offending occurrences:"
printf '%s\n' "${VIOLATIONS}" | sed 's/^/  /'
echo ""
echo "If a new caller is genuinely required, a new ADR and Agent Team Lead"
echo "approval are mandatory before this guard may be updated."
exit 1
