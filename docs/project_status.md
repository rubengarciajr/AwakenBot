# AwakenBot project status

**Version:** 1.0.0 (released 2026-11-11) · **Updated:** 2026-11-11 · **Branch:** `main`

## Done

- [x] Fork `CopilotKit/OpenBot` → `rubengarciajr/AwakenBot`, `upstream` remote set
- [x] Rename to AwakenBot (`scripts/awaken/apply.ts`, idempotent, ~1,000 files)
- [x] Off-black / off-white theme, web app and setup window, light and dark
- [x] Ice-orb logo → every icon (`scripts/awaken-brand-icons.sh`)
- [x] Bundle id `org.awakenbot.desktop`; telemetry off by default
- [x] Updater key pair; private key in GitHub secret `AWAKEN_UPDATER_PRIVATE_KEY`
- [x] Release workflow `.github/workflows/awaken-release.yml`
- [x] Docs: `project_spec.md`, `docs/awaken/architecture.md`, `docs/awaken/upgrading-from-openbot.md`,
      `docs/changelog.md`, this file
- [x] Local checks: typecheck (all workspaces + desktop), Rust 1,086 pass, desktop 575 pass,
      web app 3,479 pass (one suite needs a test database, environmental)

- [x] Merged to `main`; OpenBot's own workflows disabled in the fork
- [x] v1.0.0 released: images built by the workflow (all 19 publicly pullable), Mac app built locally
      with `scripts/awaken/release-mac.sh` because GitHub's Apple silicon runners were at capacity

## Next

- [ ] Install v1.0.0 from the DMG on a test Mac, run setup end to end
- [ ] Release v1.0.1 and confirm the installed app offers and installs the update
- [ ] Confirm with CopilotKit that church distribution fits the free local Intelligence license
- [ ] Back up `~/.tauri/awakenbot-updater.key` somewhere safe (password manager)

## Key files

| File | Purpose |
|---|---|
| `scripts/awaken/brand.ts` | Name, bundle id, colors, repository |
| `brand/logo.png` | Logo source |
| `scripts/awaken/apply.ts` | Applies branding to OpenBot's files |
| `scripts/awaken/version.ts` | Sets the next version |
| `.github/workflows/awaken-release.yml` | Builds and publishes a release |
| `scripts/awaken/release-mac.sh` | Builds the Mac app here and publishes, when GitHub's Mac runners are busy |
