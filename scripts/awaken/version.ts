#!/usr/bin/env bun
/**
 * Set AwakenBot's version: the one number that decides whether members' apps update.
 *
 *   bun scripts/awaken/version.ts            next patch (1.0.0 -> 1.0.1)
 *   bun scripts/awaken/version.ts minor      next minor (1.0.3 -> 1.1.0)
 *   bun scripts/awaken/version.ts 2.0.0      exactly this
 *
 * "Next" counts from the higher of package.json and the newest vX.Y.Z tag on GitHub, so it still
 * goes up after an upstream merge brought OpenBot's own (unrelated) version number into package.json.
 * Writes package.json, then desktop/src-tauri/Cargo.toml and Cargo.lock (desktop-version.ts sync).
 *
 * Pushing a new version to main is what releases it (.github/workflows/awaken-release.yml).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
type V = [number, number, number];
const parse = (text: string): V | undefined => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(text.trim());
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3])]
    : undefined;
};
const compare = (a: V, b: V) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const show = (v: V) => v.join(".");

const packagePath = join(ROOT, "package.json");
const packageText = readFileSync(packagePath, "utf8");
const current = parse(JSON.parse(packageText).version);
if (!current) throw new Error("package.json has no plain X.Y.Z version");

const remote = Bun.spawnSync(["git", "ls-remote", "--tags", "origin"], {
  cwd: ROOT,
});
const tags = remote.stdout
  .toString()
  .split("\n")
  .map((line) => line.split("refs/tags/")[1]?.replace("^{}", ""))
  .map((tag) => (tag ? parse(tag) : undefined))
  .filter((v): v is V => Boolean(v));
const base = [current, ...tags].sort(compare).at(-1) as V;

const arg = process.argv[2] ?? "patch";
const next: V | undefined =
  arg === "patch"
    ? [base[0], base[1], base[2] + 1]
    : arg === "minor"
      ? [base[0], base[1] + 1, 0]
      : arg === "major"
        ? [base[0] + 1, 0, 0]
        : parse(arg);
if (!next) throw new Error(`Not a version: ${arg}`);
const released = tags.find((tag) => compare(tag, next) === 0);
if (released)
  throw new Error(`v${show(next)} is already released; pick a higher version.`);

writeFileSync(
  packagePath,
  packageText.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${show(next)}"`),
);
const sync = Bun.spawnSync(
  ["bun", "desktop/scripts/desktop-version.ts", "sync"],
  {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  },
);
if (sync.exitCode !== 0) process.exit(sync.exitCode ?? 1);
console.log(
  `AwakenBot version ${show(current)} -> ${show(next)}. Commit and push to main to release it.`,
);
