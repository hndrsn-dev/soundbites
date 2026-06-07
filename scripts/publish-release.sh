#!/usr/bin/env bash
# Build DMGs and publish to GitHub Releases.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run dist

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

gh release create "$TAG" \
  "dist/SNDBTS-${VERSION}-arm64.dmg" \
  "dist/SNDBTS-${VERSION}.dmg" \
  --title "SNDBTS ${TAG}" \
  --notes "macOS test build. See README Sharing & Distribution for first-launch steps."

echo "Published: https://github.com/hndrsn-dev/soundbites/releases/tag/${TAG}"
