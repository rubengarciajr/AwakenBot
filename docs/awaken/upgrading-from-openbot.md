# Pulling in a new OpenBot release

OpenBot keeps improving. To bring its changes into AwakenBot:

```bash
git checkout main && git pull
git fetch upstream
git merge -X theirs upstream/main      # on conflicting lines, take OpenBot's version
bun install
bun scripts/awaken/apply.ts            # put the AwakenBot branding back on top
scripts/awaken-brand-icons.sh          # in case OpenBot changed any icon
bun scripts/awaken/version.ts          # next AwakenBot version (merges bring OpenBot's number)
```

Then check, commit and push:

```bash
bun run typecheck && (cd desktop && bun run typecheck && bun test)
(cd desktop/src-tauri && cargo test --locked --lib)
git commit -am "Merge OpenBot <version> into AwakenBot <version>"
git push                                # releases it; members' apps offer the update
```

## Why `-X theirs` is safe here

Every edit AwakenBot makes to an OpenBot file is made by `scripts/awaken/apply.ts`. So when a
merge conflicts, taking OpenBot's line and re-running the script gives the same result as resolving
the conflict by hand. AwakenBot's own files (see [architecture.md](architecture.md)) never conflict.

## When `apply.ts` stops with "Upstream changed it"

A line the script edits by exact text was rewritten upstream. Open the file it names, find the new
version of that line, and update the matching `replaceOnce(...)` in `scripts/awaken/apply.ts`.

## When tests fail after a merge

- **A test expects "OpenBot" text**: usually words run together (`"CompleteOpenBot"`), which the
  whole-word rule skips. Add the pair to `EXACT` in `apply.ts`.
- **A test builds a fake `~/OpenBot` folder from an old release**: add the fixture to `KEEP_FIXTURES`.
- Compare with a clean OpenBot checkout first: `git worktree add /tmp/ob upstream/main` and run the
  same test there. If it fails there too, it is not AwakenBot's.

## OpenBot workflows

OpenBot's own CI, signing and publishing workflows are meant for CopilotKit's repository. A merge
can add new ones; check the Actions tab and disable any that AwakenBot does not use.
