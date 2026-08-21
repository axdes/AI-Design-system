#!/bin/sh
# Shared SAST step. Usage, from an app: sh <this> src server tools
#
# Runs semgrep with a PATH this shell can actually see. Same problem node-path.sh
# solves for npm: semgrep is a Homebrew binary, not an npm dependency, so a
# non-interactive shell (hooks, CI, an agent's shell) does not read the profile
# that puts /opt/homebrew/bin on PATH, and `npm run check` died at lint:sast with
# "semgrep: command not found" on a machine where semgrep was installed all along.
#
# A missing semgrep is a HARD failure: skipping a security scan silently is how a
# gate stops meaning anything. The message says how to install it.
#
# Targets are passed by the caller because the interesting surface differs per
# app: a browser-only app has `src`, but the apps that spawn processes, serve
# files and hold API keys have `server/` and `tools/`, and those are plain .mjs
# that TypeScript never sees. Missing directories are skipped, not an error, so
# one script serves all four.

if ! command -v semgrep >/dev/null 2>&1; then
  for _dir in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do
    if [ -x "$_dir/semgrep" ]; then
      PATH="$_dir:$PATH"
      export PATH
      break
    fi
  done
  unset _dir
fi

if ! command -v semgrep >/dev/null 2>&1; then
  echo "semgrep not found. It is a brew binary, not an npm dependency: brew install semgrep" >&2
  exit 1
fi

# Only the directories that exist in THIS app.
targets=""
for t in "$@"; do
  [ -d "$t" ] && targets="$targets $t"
done
if [ -z "$targets" ]; then
  echo "semgrep: none of the requested targets exist here ($*) — nothing to scan." >&2
  exit 1
fi

# A local .semgrep.yml carries this app's own structural rules; it is optional.
local_rules=""
[ -f .semgrep.yml ] && local_rules="--config .semgrep.yml"

# shellcheck disable=SC2086
exec semgrep scan --error --quiet \
  $local_rules \
  --config p/react \
  --config p/typescript \
  --config p/javascript \
  --config p/nodejs \
  --config p/owasp-top-ten \
  --config p/secrets \
  $targets
