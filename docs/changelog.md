# AwakenBot changelog

AwakenBot's own version history. (OpenBot's history is in [CHANGELOG.md](../CHANGELOG.md).)
The release workflow uses the section for each version as that GitHub Release's notes.

## [1.0.0] - 2026-11-11

The first AwakenBot release, built on OpenBot 1.0.1 (CopilotKit, MIT License).

### Added
- AwakenBot name throughout the app, setup window, menus, installer and Bots.
- Off-black and off-white look in light and dark mode; colors set in `scripts/awaken/brand.ts`.
- Ice-orb logo for the app icon, Dock, menu bar, sidebar, setup window and browser extension.
- Self-updating from AwakenBot's own GitHub releases, signed with AwakenBot's own update key.
- `scripts/awaken/` tools: `apply.ts` (branding), `version.ts` (releases), and
  `scripts/awaken-brand-icons.sh` (icons).
- `.github/workflows/awaken-release.yml`: pushing a new version builds the images and the Mac app and
  publishes the release.

### Changed
- App identity is `org.awakenbot.desktop`, so AwakenBot is a separate app from OpenBot.
- "Share usage data" starts off; the desktop app sends no telemetry to CopilotKit.
- The trademark sign beside the product name is not shown.
