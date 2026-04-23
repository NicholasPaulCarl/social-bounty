#!/usr/bin/env bash
#
# install-graphify-hook.sh
#
# Installs the graphify git post-commit + post-checkout hooks if the
# `graphify` binary is on PATH. Called from `npm run prepare` after
# husky has set up .husky/_/ — graphify appends its block to the
# existing hook files (idempotent: re-running is a no-op).
#
# Skips silently when graphify isn't installed so `npm install` doesn't
# fail for devs who haven't set up the knowledge-graph tooling. To
# enable: `uv tool install graphifyy --with mcp` (or pipx equivalent).
#
# Exits 0 always — graphify is developer-local tooling, not a build
# dependency.

set -e

if command -v graphify >/dev/null 2>&1; then
  graphify hook install
else
  echo "[graphify] binary not on PATH — skipping hook install."
  echo "[graphify] to enable auto-rebuild on commit: uv tool install graphifyy --with mcp"
fi
