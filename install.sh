#!/usr/bin/env bash
# One-line bootstrap: clones the repo, installs dependencies, and starts the
# interactive Cloudflare launch wizard.
#
#   curl -fsSL https://raw.githubusercontent.com/sarthakguptadev/brandmyphone-oss/main/install.sh | bash
#
# Override the clone source or target directory:
#   REPO_URL=https://github.com/you/your-fork.git TARGET_DIR=my-site \
#     curl -fsSL ... | bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sarthakguptadev/brandmyphone-oss.git}"
TARGET_DIR="${TARGET_DIR:-brandmyphone-oss}"

for command in git node npm; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    echo "Install Node 24+ (includes npm) and git, then re-run." >&2
    exit 1
  fi
done

NODE_MAJOR="$(node --version | sed 's/^v//' | cut -d. -f1)"
if (( NODE_MAJOR < 24 )); then
  echo "Node 24+ is required (found $(node --version))." >&2
  exit 1
fi

if [[ -e "$TARGET_DIR" ]]; then
  echo "Directory '$TARGET_DIR' already exists. Move it or set TARGET_DIR." >&2
  exit 1
fi

echo "==> Cloning $REPO_URL into $TARGET_DIR"
git clone --depth 1 "$REPO_URL" "$TARGET_DIR"
cd "$TARGET_DIR"

echo "==> Installing dependencies"
npm install

# When run via `curl | bash`, stdin is the script itself; reattach the
# terminal so the launch wizard can prompt for input.
if [[ ! -t 0 ]]; then
  if (exec < /dev/tty) 2>/dev/null; then
    exec < /dev/tty
  else
    echo "Setup is done, but no interactive terminal is available for the"
    echo "launch wizard. Finish with:"
    echo
    echo "  cd $TARGET_DIR && npm run launch"
    exit 0
  fi
fi

echo "==> Starting the launch wizard"
npm run launch
