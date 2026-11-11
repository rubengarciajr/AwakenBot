#!/usr/bin/env bash
# AwakenBot: build the Mac app on THIS Mac and publish the release, using the container images the
# "AwakenBot release" workflow already built for this commit.
#
# Use it when GitHub's Apple silicon runners are too busy to pick up the workflow's "mac app" job
# ("The job was not acquired by Runner..."). It does what that job and the "publish" job do:
#
#   scripts/awaken/release-mac.sh
#
# Needs: an Apple silicon Mac; this checkout clean and at the commit pushed to origin/main; the
# workflow's images to have finished for that commit; the updater key at
# ~/.tauri/awakenbot-updater.key (override with AWAKEN_UPDATER_KEY=path); bun, cargo, gh, jq.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.bun/bin:$HOME/.cargo/bin:/opt/homebrew/bin:$PATH"
die() { printf '\nrelease-mac: %s\n' "$*" >&2; exit 1; }
say() { printf '\n==> %s\n' "$*"; }

[ "$(uname -m)" = arm64 ] || die "run this on an Apple silicon Mac"
# From the origin remote, never `gh repo view`: in a fork with an `upstream` remote, gh can resolve
# to CopilotKit/OpenBot. And only the repository brand.ts names, so nothing is ever published there.
REPOSITORY="$(git remote get-url origin | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##')"
expected="$(sed -nE 's/^ *repository: "([^"]+)".*/\1/p' scripts/awaken/brand.ts)"
[ "$REPOSITORY" = "$expected" ] || die "origin is $REPOSITORY, but brand.ts names $expected"
VERSION="$(jq -r .version package.json)"
SHA="$(git rev-parse HEAD)"
KEY="${AWAKEN_UPDATER_KEY:-$HOME/.tauri/awakenbot-updater.key}"
[ -f "$KEY" ] || die "no updater key at $KEY"
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "commit or stash your changes first"
git fetch -q origin main
[ "$SHA" = "$(git rev-parse origin/main)" ] || die "HEAD is not origin/main; push first, or check out origin/main"
if gh release view "v$VERSION" -R "$REPOSITORY" >/dev/null 2>&1; then
  die "v$VERSION is already released. Run bun scripts/awaken/version.ts for a new version."
fi

say "the images the workflow built for $SHA"
run="$(gh run list -R "$REPOSITORY" --workflow awaken-release.yml --commit "$SHA" --limit 1 --json databaseId -q '.[0].databaseId')"
[ -n "$run" ] || die "no AwakenBot release run for $SHA yet; push to main and wait for its images"
# Not under desktop/dist: the frontend build empties that folder.
OUT="$ROOT/desktop/src-tauri/target/awaken-release"
rm -rf "$OUT" && mkdir -p "$OUT"
gh run download "$run" -R "$REPOSITORY" -n container-images -D "$OUT" ||
  die "run $run has no container-images yet; wait for its images to finish"
[ "$(jq -r .version "$OUT/container-images.json")" = "v$VERSION" ] ||
  die "container-images.json is for $(jq -r .version "$OUT/container-images.json"), not v$VERSION"

say "the app (release $VERSION, bundled CLI, updater)"
(cd desktop && bun install --frozen-lockfile >/dev/null)
(cd desktop && bun scripts/desktop-version.ts release >/dev/null)
bun desktop/scripts/cli-bundle.ts darwin arm64
rm -rf desktop/src-tauri/target/release/bundle desktop/dist/shell-updates
(
  cd desktop
  export APPLE_SIGNING_IDENTITY="-"
  export OPENBOT_BUNDLED_CLI=1
  export OPENBOT_DISTRIBUTION_ID="$REPOSITORY" OPENBOT_RELEASE_REPOSITORY="$REPOSITORY" OPENBOT_RELEASE_CHANNEL=stable
  export OPENBOT_SHELL_UPDATE_ENDPOINT="https://github.com/$REPOSITORY/releases/latest/download/latest.json"
  OPENBOT_SHELL_UPDATE_PUBLIC_KEY="$(tr -d '\n' < ../brand/updater-public.key)"
  TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY")"
  export OPENBOT_SHELL_UPDATE_PUBLIC_KEY TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}"
  # The app bundle and its signed update. The DMG is made below with hdiutil: Tauri's DMG script
  # drives Finder, which fails outside a logged-in desktop session.
  bun scripts/build-shell-update.ts --bundles app \
    --config src-tauri/tauri.build-version.conf.json \
    --config src-tauri/tauri.bundled-cli.conf.json
)

say "the release files"
OPENBOT_DISTRIBUTION_ID="$REPOSITORY" OPENBOT_RELEASE_REPOSITORY="$REPOSITORY" OPENBOT_RELEASE_CHANNEL=stable \
  OPENBOT_SHELL_ASSET_BASE_URL="https://github.com/$REPOSITORY/releases/download/v$VERSION" \
  bun desktop/scripts/collect-shell-update.ts
cp desktop/dist/shell-updates/*.app.tar.gz desktop/dist/shell-updates/*.app.tar.gz.sig "$OUT/"
cp desktop/dist/shell-updates/fragment-darwin-aarch64.json "$OUT/latest.json"
stage="$(mktemp -d)"
cp -R desktop/src-tauri/target/release/bundle/macos/AwakenBot.app "$stage/"
ln -s /Applications "$stage/Applications"
hdiutil create -quiet -volname AwakenBot -srcfolder "$stage" -ov -format UDZO "$OUT/AwakenBot-mac.dmg"
rm -rf "$stage"
cp "$OUT/AwakenBot-mac.dmg" "$OUT/AwakenBot_${VERSION}_mac-apple-silicon.dmg"
codesign --verify --deep --strict "desktop/src-tauri/target/release/bundle/macos/AwakenBot.app"
ls -la "$OUT"

say "GitHub Release v$VERSION"
awk -v v="$VERSION" '
  $0 ~ "^## \\[?v?" v "\\]?" { on = 1; next }
  on && /^## / { exit }
  on { print }
' docs/changelog.md > "$OUT/notes.md" || true
grep -q '[^[:space:]]' "$OUT/notes.md" || echo "AwakenBot $VERSION" > "$OUT/notes.md"
cat >> "$OUT/notes.md" <<EOF

### Install
Download **AwakenBot-mac.dmg** (Apple silicon Macs), open it and drag AwakenBot to Applications.
The first time, right-click AwakenBot in Applications and choose **Open**. Later versions install themselves.
EOF
gh release create "v$VERSION" -R "$REPOSITORY" --target "$SHA" --title "AwakenBot $VERSION" \
  --notes-file "$OUT/notes.md" --latest \
  "$OUT/container-images.json" "$OUT/latest.json" "$OUT"/*.app.tar.gz "$OUT"/*.app.tar.gz.sig \
  "$OUT/AwakenBot-mac.dmg" "$OUT/AwakenBot_${VERSION}_mac-apple-silicon.dmg"
say "published: https://github.com/$REPOSITORY/releases/tag/v$VERSION"
