# Sourceable: puts a node/npm on PATH.
#
# Hooks (git pre-commit, the Claude Code Edit/Stop hooks) run in a bare
# non-interactive /bin/sh, which does not read the shell profile — so an nvm- or
# Homebrew-installed node is invisible there and every hook dies with
# "npm: command not found". Everything that shells out to npm sources this first.
#
# Usage:  . "$(git rev-parse --show-toplevel)/scripts/node-path.sh"

if ! command -v npm >/dev/null 2>&1; then
  for _dir in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
    if [ -x "$_dir/npm" ]; then
      PATH="$_dir:$PATH"
      export PATH
      break
    fi
  done
  unset _dir
fi
