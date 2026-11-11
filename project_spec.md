# AwakenBot: project spec

AwakenBot is a church-branded edition of [OpenBot](https://github.com/CopilotKit/OpenBot) (MIT
License, © CopilotKit), distributed to church members as a macOS app that updates itself from
GitHub.

- **Repository:** https://github.com/rubengarciajr/AwakenBot (fork of `CopilotKit/OpenBot`)
- **Upstream remote:** `upstream` → https://github.com/CopilotKit/OpenBot.git
- **Owner:** Ruben Garcia Jr

## Goals

1. Members install one DMG and get a working AI assistant ("Bots") on their own Mac.
2. Everything a member sees says AwakenBot, in AwakenBot's off-black / off-white look and ice-orb logo.
3. Pushing a new version to GitHub is all it takes for every installed app to offer the update.
4. No Apple Developer account is required. (One can be added later for a smoother first install.)
5. Pulling in new OpenBot releases stays a short, mostly automatic job.

## Requirements

| Area | Requirement | How it is met |
|---|---|---|
| Name | "AwakenBot" everywhere a person reads it | `scripts/awaken/apply.ts` renames whole-word "OpenBot" in app, desktop, server, Bots, tests |
| Colors | Off-black `#1b1a18`, off-white `#f6f4ef`, changeable in one place | `scripts/awaken/brand.ts` → `app/src/awaken/palette.css`; everything else is mixed from the two |
| Logo | Ice orb, replaceable | `brand/logo.png` → `scripts/awaken-brand-icons.sh` → Dock, DMG, menu bar, in-app, extension icons |
| App identity | Separate app from OpenBot | Bundle id `org.awakenbot.desktop`, product name `AwakenBot` |
| Install source | AwakenBot's own releases and images | `OPENBOT_RELEASE_REPOSITORY=rubengarciajr/AwakenBot`; images at `ghcr.io/rubengarciajr/awakenbot-*` |
| Updates | Self-update without Apple signing | Tauri updater (`shell-updater` feature), signed with AwakenBot's own minisign key |
| Privacy | No usage data to CopilotKit by default | Desktop telemetry off; "Share usage data" defaults to off |
| Platform | macOS, Apple silicon | `macos-latest` GitHub runner, ad-hoc code signature |

## Release contract (what the app needs from a GitHub release)

A release is a tag `vX.Y.Z`, marked **Latest**, with these assets:

| Asset | Used by | Required |
|---|---|---|
| `container-images.json` | Install and every upgrade: pins each image by digest | Yes |
| (tag source archive, made by GitHub) | Install and upgrade: `docker-compose.yml` | Yes (automatic) |
| `latest.json` | Installed apps' update check (every 6 hours and at launch) | Yes, for updates |
| `AwakenBot.app.tar.gz` + `.sig` | The update itself, verified with `brand/updater-public.key` | Yes, for updates |
| `AwakenBot-mac.dmg` | First install (fixed name, so the link never changes) | Yes |
| `AwakenBot_X.Y.Z_mac-apple-silicon.dmg` | Same DMG, versioned name | No |

Container images must be **public** on ghcr.io: the app pulls them without signing in.

## External dependencies

- **CopilotKit Intelligence (local).** OpenBot runs only in "Intelligence mode". The app bundles the
  CopilotKit CLI, which sets up local Intelligence and asks each member to sign in with a free
  CopilotKit account. CopilotKit's README describes the free local license as "for personal use and
  experimentation". **Confirm with CopilotKit that church distribution fits that license.**
- **An AI provider** chosen by each member at setup (ChatGPT/Claude plan or an API key).
- **Docker or Podman**, installed by the app if missing.

## Secrets and keys

| Item | Where | Notes |
|---|---|---|
| Updater private key | `~/.tauri/awakenbot-updater.key` and GitHub secret `AWAKEN_UPDATER_PRIVATE_KEY` | **Back it up.** Lost = installed apps can never update again |
| Updater public key | `brand/updater-public.key` (committed) | Compiled into every app |

## Out of scope (for now)

- Windows and Linux installers, iOS/Android apps, Helm/Kubernetes deployment.
- Apple Developer ID signing and notarization.
- Renaming internal identifiers (`openbot` in env vars, container names, the `openbot://` link scheme).
