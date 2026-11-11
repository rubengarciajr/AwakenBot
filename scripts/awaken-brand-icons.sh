#!/usr/bin/env bash
# AwakenBot: regenerate every icon from one square logo.
#
#   scripts/awaken-brand-icons.sh [path/to/logo.png]     (default: brand/logo.png)
#
# The logo should be a square PNG, 1024x1024 or larger, ideally with a transparent background.
# It replaces OpenBot's orb everywhere it appears:
#   - the Mac app / Dock / DMG icon, Windows and Linux icons   desktop/src-tauri/icons/*
#   - the menu-bar (tray) icon                                 desktop/src-tauri/icons/64x64.png
#   - the logo inside the app's sidebar and screens            app/src/assets/openbot-logo.png
#   - the logo on the desktop setup window                     (reads the app's logo, see desktop/src/awaken.css)
#   - the browser extension icons                              extension/public/icons/*.png
#
# Run it again after merging an upstream OpenBot update, in case they changed any of these files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGO="${1:-$ROOT/brand/logo.png}"
[ -f "$LOGO" ] || { echo "No logo at $LOGO" >&2; exit 1; }

read -r width height < <(sips -g pixelWidth -g pixelHeight "$LOGO" | awk '/pixel/ {print $2}' | xargs)
[ "$width" = "$height" ] || { echo "The logo must be square; $LOGO is ${width}x${height}." >&2; exit 1; }
[ "$width" -ge 1024 ] || echo "warning: the logo is ${width}px; 1024px or larger looks sharper on the Dock." >&2

icons="$ROOT/desktop/src-tauri/icons"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "==> desktop app, Dock and tray icons"
# Mac app icons keep a transparent margin (Apple's grid draws the icon body at 824 of 1024px), so a
# logo that runs edge to edge is shrunk onto that grid; otherwise it looks oversized in the Dock.
# AWAKEN_ICON_BODY=1024 turns the margin off.
body="${AWAKEN_ICON_BODY:-824}"
sips -s format png -z "$body" "$body" "$LOGO" --out "$work/body.png" >/dev/null
sips -p 1024 1024 "$work/body.png" --out "$work/app-icon.png" >/dev/null
# Tauri's own generator writes every size the bundles name (icns, ico, PNGs, Windows Store tiles).
# It also writes ios/ and android/ folders, which this desktop-only app does not use.
npx --yes @tauri-apps/cli@2 icon "$work/app-icon.png" --output "$icons" >/dev/null
rm -rf "$icons/ios" "$icons/android"
# The menu-bar (tray) icon is tiny, so it uses the logo full size, without the Dock margin.
sips -s format png -z 64 64 "$LOGO" --out "$icons/64x64.png" >/dev/null

echo "==> in-app logo"
sips -s format png -z 256 256 "$LOGO" --out "$ROOT/app/src/assets/openbot-logo.png" >/dev/null

echo "==> browser extension icons"
for size in 16 32 48 128; do
  sips -s format png -z "$size" "$size" "$LOGO" --out "$ROOT/extension/public/icons/$size.png" >/dev/null
done

echo "Done. Review with: git status"
