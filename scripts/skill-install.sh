#!/bin/sh
# Install the design system's Agent Skill from a GitHub release.
#
#   curl -fsSL https://github.com/axdes/AI-Design-system/releases/latest/download/skill-install.sh | sh -s -- --skill design-system
#
# Where it puts things, and why there are two answers:
#
#   default   ./.agents/skills/<skill>      the project, and the cross-tool path.
#             Codex, Cursor, Gemini CLI, Copilot and Claude Code all read it, and
#             it travels with the repository, so everybody working in that repo
#             gets the same contract without installing anything.
#   --user    ~/.claude/skills/<skill>      one person's machine, every project.
#             Claude Code's personal scope; nothing else reads it.
#
# Same argument as AGENTS.md over CLAUDE.md, one directory down: `.claude` is one
# vendor's path, `.agents` is the shared one. The default is the shared one.
set -eu

REPO="axdes/AI-Design-system"
SKILL="design-system"
TAG="latest"
DEST=""
URL=""
USER_SCOPE=0

usage() {
  cat <<USAGE
Usage: skill-install.sh [--skill <name>] [--dest <dir>] [--user] [--tag <tag>] [--repo <owner/name>]

  --skill <name>   which skill to install (default: design-system)
  --dest <dir>     the skills directory to install into
  --user           install into ~/.claude/skills instead of ./.agents/skills
  --tag <tag>      a release tag, e.g. skill-v1.0.0 (default: latest)
  --repo <o/n>     the GitHub repository holding the release
  --url <url>      install from this archive instead of a release (file:// works,
                   which is how the release is tried before it is cut)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --skill) SKILL="${2:?--skill needs a name}"; shift 2 ;;
    --dest) DEST="${2:?--dest needs a directory}"; shift 2 ;;
    --user) USER_SCOPE=1; shift ;;
    --tag) TAG="${2:?--tag needs a tag}"; shift 2 ;;
    --repo) REPO="${2:?--repo needs owner/name}"; shift 2 ;;
    --url) URL="${2:?--url needs a URL}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "tar is required" >&2; exit 1; }

if [ -z "$DEST" ]; then
  if [ "$USER_SCOPE" -eq 1 ]; then DEST="$HOME/.claude/skills"; else DEST="$PWD/.agents/skills"; fi
fi

if [ -z "$URL" ]; then
  if [ "$TAG" = "latest" ]; then
    URL="https://github.com/$REPO/releases/latest/download/$SKILL-skill.tar.gz"
  else
    URL="https://github.com/$REPO/releases/download/$TAG/$SKILL-skill.tar.gz"
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

echo "→ $URL"
curl -fsSL "$URL" -o "$TMP/skill.tar.gz" || {
  echo "✗ that release asset is not there. Check the tag, or list what exists:" >&2
  echo "    gh release list --repo $REPO" >&2
  exit 1
}
tar -xzf "$TMP/skill.tar.gz" -C "$TMP"

[ -f "$TMP/$SKILL/SKILL.md" ] || { echo "✗ the archive has no $SKILL/SKILL.md — wrong asset?" >&2; exit 1; }

mkdir -p "$DEST"
# The skill is generated, so a copy on disk is replaceable in full: an install that
# merged into an older one would leave references the current SKILL.md never names.
[ -d "$DEST/$SKILL" ] && rm -rf "$DEST/$SKILL"
cp -R "$TMP/$SKILL" "$DEST/$SKILL"

VERSION="$(sed -n 's/^  version: *//p' "$DEST/$SKILL/SKILL.md" | head -1)"
COUNT="$(find "$DEST/$SKILL" -type f | wc -l | tr -d ' ')"
echo "✓ $SKILL ${VERSION:-(no version stated)} installed: $DEST/$SKILL ($COUNT files)"
echo
echo "  It fires by itself when the task is UI. Nothing else to switch on."
echo "  The live tools (props, verify, the decision rules answered on your code)"
echo "  are an MCP server: $DEST/$SKILL/references/guides/mcp.md says how."
