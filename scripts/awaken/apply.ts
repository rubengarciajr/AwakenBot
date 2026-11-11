#!/usr/bin/env bun
/**
 * AwakenBot rebrand: applies every AwakenBot change that edits an OpenBot file. Idempotent.
 *
 *   bun scripts/awaken/apply.ts           apply
 *   bun scripts/awaken/apply.ts --check   exit 1 if anything is left to apply (CI uses this)
 *
 * Why a script: OpenBot names itself ~9,000 times. Editing those by hand would make every upstream
 * merge a wall of conflicts. Instead, after `git merge -X theirs upstream/main` takes OpenBot's
 * version of any conflicting line, running this puts the AwakenBot branding back. See
 * docs/awaken/upgrading-from-openbot.md.
 *
 * Files that are AwakenBot's own (app/src/awaken/, desktop/src/awaken.css, brand/, scripts/awaken/,
 * .github/workflows/awaken-*.yml) never conflict and are not touched here.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { BRAND } from "./brand";

const ROOT = resolve(import.meta.dir, "../..");
const check = process.argv.includes("--check");
const changed = new Set<string>();

function edit(path: string, change: (text: string) => string) {
  const file = join(ROOT, path);
  const before = readFileSync(file, "utf8");
  const after = change(before);
  if (after !== before) {
    changed.add(path);
    if (!check) writeFileSync(file, after);
  }
}

/**
 * Replace `from` with `to` once, unless `marker` shows it was already done (by this script or by
 * hand). Throws when neither is there: upstream changed the line, so this script needs updating.
 */
function replaceOnce(path: string, from: string, to: string, marker: string) {
  edit(path, (text) => {
    if (text.includes(marker)) return text;
    if (!text.includes(from)) {
      throw new Error(
        `${path}: expected to find ${JSON.stringify(from)}. Upstream changed it; update scripts/awaken/apply.ts.`,
      );
    }
    return text.replace(from, to);
  });
}

/** Set a top-level-ish JSON string value in place, keeping the file's own formatting. */
function setJsonString(
  text: string,
  key: string,
  value: string,
  occurrence: "first" | "all" = "first",
) {
  const pattern = new RegExp(
    `("${key}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`,
    occurrence === "all" ? "g" : "",
  );
  if (!pattern.test(text))
    throw new Error(
      `tauri.conf.json: no "${key}". Upstream changed it; update scripts/awaken/apply.ts.`,
    );
  pattern.lastIndex = 0;
  return text.replace(pattern, `$1${JSON.stringify(value)}`);
}

// ---------------------------------------------------------------------------------------------
// 1. The product name, everywhere a person can read it.
//
// Whole word, exact case: "OpenBot" and "OpenBot's" change; "OpenBotLogo", "isOpenBot", "openbot",
// "OPENBOT_*" do not. A name right after "word/" is a repository or a path ("CopilotKit/OpenBot",
// "/Users/person/OpenBot", "~/OpenBot") and stays, so
// links to the upstream project and the check that keeps CopilotKit's download mirror for
// CopilotKit's own releases both keep working. Identifiers that are exactly `OpenBot` (an enum
// variant, say) are renamed consistently in the same pass, so they still compile.
// ---------------------------------------------------------------------------------------------
const SWEEP_DIRS = [
  "app",
  "desktop",
  "shared",
  "extension",
  "server",
  "worker",
  "toolkit",
  "supervisor",
  "examples",
  "tests",
  ...readdirSync(ROOT).filter((name) => name.startsWith("agent-")),
  "docker-compose.yml",
  "Dockerfile",
];
const SWEEP_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".rs",
  ".html",
  ".css",
  ".json",
  ".yaml",
  ".yml",
  ".py",
  ".plist",
  ".nsh",
  ".nsi",
  ".toml",
  ".sh",
  ".ps1",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "target",
  "gen",
  ".turbo",
  "__pycache__",
  ".venv",
]);
const SKIP_PREFIXES = [
  // AwakenBot's own files describe what they replace, by name.
  "app/src/awaken/",
  "desktop/src/awaken.css",
  // CopilotKit's own release, signing and test-machine tooling. AwakenBot releases with
  // .github/workflows/awaken-release.yml instead; these stay exactly as upstream wrote them.
  "desktop/scripts/",
];
/**
 * Test fixtures that stand for a folder an earlier upstream release made (`~/OpenBot`), kept as that
 * release named it: the expectations derived from them (a Compose project called "openbot") would
 * otherwise no longer match. Applied after the rename, per file.
 */
const KEEP_FIXTURES: Record<
  string,
  ReadonlyArray<readonly [string, string]>
> = {
  "desktop/src-tauri/src/stack.rs": [
    [
      'computer_stop_root(&path, "AwakenBot", "{}")',
      'computer_stop_root(&path, "OpenBot", "{}")',
    ],
    ['.join("AwakenBot")', '.join("OpenBot")'],
    ['"/home/someone/My AwakenBot!"', '"/home/someone/My OpenBot!"'],
  ],
};
/** Test text that runs words together ("Complete" + "OpenBot"), which the whole-word rule skips. */
const EXACT = [
  ["CompleteOpenBot", "CompleteAwakenBot"],
  ["OpenBotStep", "AwakenBotStep"],
] as const;
/** Files under a skipped prefix that are renamed anyway: tests that read files the rename changes. */
const SWEEP_ANYWAY = new Set([
  // Reads desktop/src-tauri/windows/hooks.nsh, which is renamed (the app's own Windows paths are).
  "desktop/scripts/installer-update.test.ts",
]);
const NAME = /(?<![\w~]\/)(?<!\w)OpenBot(?!\w)/g;
// The app finds its own config, log and data folders by its bundle id (APP_IDENTIFIER in main.rs,
// recorder_host.rs, logging.rs...), so every copy of the id follows tauri.conf.json's.
const UPSTREAM_BUNDLE_ID = "ai.copilotkit.openbot.desktop";

function* walk(path: string): Generator<string> {
  const full = join(ROOT, path);
  const stat = statSync(full, { throwIfNoEntry: false });
  if (!stat) return;
  if (stat.isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(full)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    yield* walk(join(path, entry));
  }
}

for (const dir of SWEEP_DIRS) {
  for (const path of walk(dir)) {
    const dot = path.lastIndexOf(".");
    const extension = dot >= 0 ? path.slice(dot) : "";
    const isDockerfile = /(^|\/)Dockerfile[^/]*$/.test(path);
    if (!SWEEP_EXTENSIONS.has(extension) && !isDockerfile) continue;
    if (
      SKIP_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
      !SWEEP_ANYWAY.has(path)
    )
      continue;
    const rename = (text: string) => {
      let out = text.replaceAll(UPSTREAM_BUNDLE_ID, BRAND.bundleIdentifier);
      out = out.replace(NAME, BRAND.productName);
      for (const [from, to] of EXACT) out = out.replaceAll(from, to);
      return out;
    };
    edit(path, (text) => {
      let out = rename(text);
      for (const [renamed, kept] of KEEP_FIXTURES[path] ?? [])
        out = out.replaceAll(renamed, kept);
      return out;
    });
  }
}

// ---------------------------------------------------------------------------------------------
// 2. The desktop app's identity: bundle id, installer metadata.
// ---------------------------------------------------------------------------------------------
edit("desktop/src-tauri/tauri.conf.json", (text) => {
  let out = text;
  out = setJsonString(out, "productName", BRAND.productName);
  out = setJsonString(out, "identifier", BRAND.bundleIdentifier);
  out = setJsonString(out, "title", BRAND.productName, "all");
  out = setJsonString(out, "publisher", BRAND.publisher);
  out = setJsonString(out, "copyright", BRAND.copyright);
  out = setJsonString(out, "category", "Productivity");
  out = setJsonString(out, "shortDescription", BRAND.shortDescription);
  out = setJsonString(out, "longDescription", BRAND.longDescription);
  JSON.parse(out); // still valid
  return out;
});

// ---------------------------------------------------------------------------------------------
// 3. Colors the native window paints before any CSS loads (keep in step with palette.css).
// ---------------------------------------------------------------------------------------------
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => `0x${hex.slice(i, i + 2).toLowerCase()}`).join(", ");
edit("desktop/src-tauri/src/main.rs", (text) =>
  text
    .replace(
      /const SETUP_BACKGROUND: tauri::window::Color = tauri::window::Color\([^)]*\);/,
      `const SETUP_BACKGROUND: tauri::window::Color = tauri::window::Color(${rgb(BRAND.paper)}, 0xff);`,
    )
    .replace(
      /const SETUP_BACKGROUND_DARK: tauri::window::Color = tauri::window::Color\([^)]*\);/,
      `const SETUP_BACKGROUND_DARK: tauri::window::Color = tauri::window::Color(${rgb(BRAND.ink)}, 0xff);`,
    ),
);
edit("app/src/awaken/palette.css", (text) =>
  text
    .replace(/--awaken-ink: [^;]+;/, `--awaken-ink: ${BRAND.ink};`)
    .replace(/--awaken-paper: [^;]+;/, `--awaken-paper: ${BRAND.paper};`),
);

// ---------------------------------------------------------------------------------------------
// 4. Load AwakenBot's colors after OpenBot's own.
// ---------------------------------------------------------------------------------------------
replaceOnce(
  "app/src/styles.css",
  '@import "./theme.css";\n@import "./skins/skins.css";',
  '@import "./theme.css";\n/* AwakenBot brand colors: scripts/awaken/brand.ts, written into app/src/awaken/palette.css. */\n@import "./awaken/theme.css";\n@import "./skins/skins.css";',
  '@import "./awaken/theme.css";',
);
replaceOnce(
  "desktop/src/main.tsx",
  'import "./styles.css";\nimport { UpdateOffer }',
  'import "./styles.css";\n// AwakenBot brand colors, after styles.css so they win (app/src/awaken/palette.css).\nimport "./awaken.css";\nimport { UpdateOffer }',
  'import "./awaken.css";',
);

// ---------------------------------------------------------------------------------------------
// 5. The tray icon test held the icon to the upstream pink-and-blue orb; AwakenBot's has white
//    highlights. Visibility and variety are still checked.
// ---------------------------------------------------------------------------------------------
edit("desktop/src-tauri/src/tray.rs", (text) =>
  text.replace(
    / {16}let channels = &pixel\[\.\.3\];\n {16}assert!\(\n {20}channels\.iter\(\)\.max\(\)\.unwrap\(\) - channels\.iter\(\)\.min\(\)\.unwrap\(\) > 20,\n {20}"the orb interior must retain its color"\n {16}\);\n/,
    "                // AwakenBot: upstream per-pixel saturation check is dropped here. It held the\n                // icon to the upstream pink-and-blue orb; AwakenBot's ice orb (brand/logo.png) has\n                // near-white highlights. Visibility above and variety below still apply.\n",
  ),
);

// ---------------------------------------------------------------------------------------------
// 6. Usage data: off unless the person turns it on in Settings, and the desktop app's own
//    telemetry (which goes to CopilotKit's servers) is off entirely.
// ---------------------------------------------------------------------------------------------
replaceOnce(
  "desktop/src-tauri/src/usage_data.rs",
  `.and_then(|record| record.get("share")?.as_bool())\n        .unwrap_or(true)`,
  `.and_then(|record| record.get("share")?.as_bool())\n        // AwakenBot: off until the person turns it on in Settings.\n        .unwrap_or(false)`,
  "// AwakenBot: off until the person turns it on in Settings.",
);
replaceOnce(
  "desktop/src-tauri/src/desktop_telemetry.rs",
  "            telemetry::Config {\n                enabled: true,",
  "            telemetry::Config {\n                // AwakenBot: the desktop app's own telemetry is off.\n                enabled: false,",
  "// AwakenBot: the desktop app's own telemetry is off.",
);

// ---------------------------------------------------------------------------------------------
// 7. Tests that pin upstream's own choices, pointed at AwakenBot's.
// ---------------------------------------------------------------------------------------------
replaceOnce(
  "desktop/src-tauri/src/usage_data.rs",
  `        assert!(saved(&directory), "nothing saved yet shares, as before");`,
  `        assert!(!saved(&directory), "AwakenBot: nothing saved yet does not share");`,
  `"AwakenBot: nothing saved yet does not share"`,
);
replaceOnce(
  "desktop/src-tauri/src/usage_data.rs",
  `        std::fs::write(directory.join(FILE), "not json").unwrap();\n        assert!(saved(&directory));`,
  `        std::fs::write(directory.join(FILE), "not json").unwrap();\n        assert!(!saved(&directory));`,
  `"not json").unwrap();\n        assert!(!saved(&directory));`,
);
edit("desktop/scripts/installer-publisher.test.ts", (text) =>
  text
    .replace(
      'expect(publisherOf(config)).toBe("CopilotKit");',
      `expect(publisherOf(config)).toBe(${JSON.stringify(BRAND.publisher)});`,
    )
    .replace(
      'expect(config.bundle.copyright).toBe("OpenBot by CopilotKit");',
      `expect(config.bundle.copyright).toBe(${JSON.stringify(BRAND.copyright)});`,
    )
    .replace(
      'expect(config.identifier).toBe("ai.copilotkit.openbot.desktop");',
      `expect(config.identifier).toBe(${JSON.stringify(BRAND.bundleIdentifier)});`,
    )
    .replace(
      'expect(publisherOf(config).toLowerCase()).toBe("copilotkit");',
      `expect(publisherOf(config).toLowerCase()).toBe(${JSON.stringify(BRAND.publisher.toLowerCase())});`,
    ),
);

// The upstream test that lists every workflow job building the Mac app, now with AwakenBot's.
replaceOnce(
  "desktop/scripts/signing-workflows.test.ts",
  'expect(macOnly).toEqual(["desktop-macos-signing.yml:sign"]);',
  'expect(macOnly).toEqual([\n    "awaken-release.yml:mac",\n    "desktop-macos-signing.yml:sign",\n  ]);',
  '"awaken-release.yml:mac"',
);

// ---------------------------------------------------------------------------------------------
const list = [...changed].sort();
if (check) {
  if (list.length) {
    console.error(
      `AwakenBot branding is not fully applied (${list.length} files). Run: bun scripts/awaken/apply.ts`,
    );
    for (const path of list.slice(0, 40)) console.error(`  ${path}`);
    process.exit(1);
  }
  console.log("AwakenBot branding is fully applied.");
} else {
  /*
   * "AwakenBot" is two letters longer than "OpenBot", which can push a line past the formatters'
   * width. Format what changed, with the repository's own settings, so the tree stays as upstream's
   * CI would want it. A second run renames nothing, so it formats nothing: still idempotent.
   */
  const run = (command: string[], cwd = ROOT) => {
    const result = Bun.spawnSync(command, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    if (result.exitCode !== 0) {
      console.error(
        `${command.join(" ")} failed:\n${result.stderr.toString()}`,
      );
      process.exit(1);
    }
  };
  const web = list.filter((path) =>
    /\.(ts|tsx|js|mjs|cjs|json|css)$/.test(path),
  );
  if (web.length)
    run([
      "bunx",
      "biome",
      "format",
      "--write",
      "--no-errors-on-unmatched",
      ...web,
    ]);
  if (
    list.some(
      (path) => path.startsWith("desktop/src-tauri/") && path.endsWith(".rs"),
    )
  )
    run(["cargo", "fmt"], join(ROOT, "desktop/src-tauri"));
  console.log(
    list.length
      ? `Updated ${list.length} files.`
      : "Nothing to change: AwakenBot branding is already applied.",
  );
  for (const path of list.slice(0, 40))
    console.log(`  ${relative(ROOT, join(ROOT, path))}`);
  if (list.length > 40) console.log(`  ...and ${list.length - 40} more`);
}
