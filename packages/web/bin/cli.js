#!/usr/bin/env node
/**
 * @terracelab/conjure-web — scaffolder CLI.
 *
 *   npx @terracelab/conjure-web init [target] [options]
 *
 * Copies the dashboard template into `target`, wires in your Django schema, and runs
 * codegen (codegen/assemble.py) so the router/sidebar match your models. The output is
 * a normal Vite + React app that you own — install it, point it at your Conjure API,
 * build, and host the `dist/`.
 *
 * Zero runtime dependencies: Node built-ins only. Codegen shells out to python3
 * (you already have Python — you run Django), and can be skipped with --no-codegen.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, "..");
const TEMPLATE_DIR = join(PKG_ROOT, "template");
const VERSION = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;

// Entries never copied into a scaffold (build artifacts / local-only / VCS noise).
const SKIP = new Set(["node_modules", "dist", ".DS_Store"]);
const skip = (name) =>
  SKIP.has(name) || name.endsWith(".tsbuildinfo") || name.endsWith(".local");

// npm strips `.gitignore` from published tarballs, so the CLI always writes one into the
// scaffold (rather than relying on the copied template file, which is absent when installed
// from npm). A standalone project doesn't need the monorepo's `!src/lib/` re-include.
const GITIGNORE = `node_modules
dist
*.local
*.tsbuildinfo
.DS_Store
`;

// ── tiny ansi + logging ────────────────────────────────────────────────────
const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};
const info = (s) => console.log(s);
const ok = (s) => console.log(`${c.green("✓")} ${s}`);
const die = (s) => {
  console.error(`${c.red("✗")} ${s}`);
  process.exit(1);
};

const HELP = `${c.bold("@terracelab/conjure-web")} — scaffold the Conjure admin dashboard

${c.bold("Usage")}
  npx @terracelab/conjure-web init [target] [options]

${c.bold("Arguments")}
  target                 Directory to scaffold into (default: conjure-admin)

${c.bold("Options")}
  --snapshot <path>      Schema snapshot JSON to use (default: ./schema-snapshot.json if present).
                         Produce one with:  python manage.py conjure_dump_schema > schema-snapshot.json
  --manifest <path>      pages-manifest.json (navigation structure). Optional; codegen falls
                         back to a shipped example when omitted.
  --no-codegen           Copy the template but skip running codegen/assemble.py.
  --force                Scaffold into a non-empty directory (may overwrite files).
  -h, --help             Show this help.
  -v, --version          Show the CLI version.

${c.bold("Example")}
  python manage.py conjure_dump_schema > schema-snapshot.json
  npx @terracelab/conjure-web init conjure-admin
  cd conjure-admin && pnpm install && pnpm dev
`;

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { target: null, snapshot: null, manifest: null, codegen: true, force: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-h":
      case "--help":
        info(HELP);
        process.exit(0);
        break;
      case "-v":
      case "--version":
        info(VERSION);
        process.exit(0);
        break;
      case "--no-codegen":
        opts.codegen = false;
        break;
      case "--force":
        opts.force = true;
        break;
      case "--snapshot":
        opts.snapshot = argv[++i] ?? die("--snapshot needs a path");
        break;
      case "--manifest":
        opts.manifest = argv[++i] ?? die("--manifest needs a path");
        break;
      default:
        if (a.startsWith("-")) die(`Unknown option: ${a}`);
        positional.push(a);
    }
  }
  // The only command is `init`; accept it explicitly or implicitly.
  if (positional[0] === "init") positional.shift();
  opts.target = positional[0] ?? "conjure-admin";
  return opts;
}

// ── recursive copy (no fs.cp ExperimentalWarning across Node 18–22) ───────────
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (skip(name)) continue;
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyDir(from, to);
    else copyFileSync(from, to);
  }
}

function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).filter((n) => n !== ".DS_Store").length === 0;
}

// ── run codegen via python3 (fallback to python) ──────────────────────────────
function runCodegen(targetDir) {
  const script = join("codegen", "assemble.py");
  for (const py of ["python3", "python"]) {
    const r = spawnSync(py, [script], { cwd: targetDir, stdio: "inherit" });
    if (r.error && r.error.code === "ENOENT") continue; // interpreter not found, try next
    if (r.status === 0) return true;
    die(`codegen failed (${py} ${script} exited ${r.status}).`);
  }
  info(
    c.dim(
      `  (python not found — skipped codegen. Run it later:  cd ${targetDir} && python3 codegen/assemble.py)`,
    ),
  );
  return false;
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const target = resolve(process.cwd(), opts.target);

  if (!existsSync(TEMPLATE_DIR)) die(`template not found at ${TEMPLATE_DIR} (broken install?)`);
  if (!isEmptyDir(target) && !opts.force) {
    die(`${opts.target} is not empty. Use --force to scaffold into it anyway.`);
  }

  info(`\n${c.bold("Conjure")} — scaffolding the admin dashboard into ${c.cyan(opts.target)}\n`);

  copyDir(TEMPLATE_DIR, target);
  writeFileSync(join(target, ".gitignore"), GITIGNORE); // npm strips the template's own
  ok(`copied template → ${opts.target}/`);

  // Wire in the schema snapshot (CLI flag → ./schema-snapshot.json in cwd → leave example).
  const snapshotSrc =
    opts.snapshot ??
    (existsSync(join(process.cwd(), "schema-snapshot.json"))
      ? join(process.cwd(), "schema-snapshot.json")
      : null);
  const codegenDir = join(target, "codegen");
  if (snapshotSrc) {
    if (!existsSync(snapshotSrc)) die(`schema snapshot not found: ${snapshotSrc}`);
    copyFileSync(snapshotSrc, join(codegenDir, "schema-snapshot.json"));
    ok(`schema snapshot → codegen/schema-snapshot.json`);
  } else {
    info(
      c.dim(
        "  no schema-snapshot.json found — using the shipped example.\n" +
          "  generate yours:  python manage.py conjure_dump_schema > schema-snapshot.json",
      ),
    );
  }

  // Optional navigation manifest.
  const manifestSrc =
    opts.manifest ??
    (existsSync(join(process.cwd(), "pages-manifest.json"))
      ? join(process.cwd(), "pages-manifest.json")
      : null);
  if (manifestSrc) {
    if (!existsSync(manifestSrc)) die(`pages manifest not found: ${manifestSrc}`);
    copyFileSync(manifestSrc, join(codegenDir, "pages-manifest.json"));
    ok(`pages manifest → codegen/pages-manifest.json`);
  }

  if (opts.codegen) {
    if (runCodegen(target)) ok("ran codegen (router + sidebar + sections)");
  } else {
    info(c.dim("  skipped codegen (--no-codegen)"));
  }

  info(`\n${c.green(c.bold("Done."))} Next steps:\n`);
  info(`  ${c.cyan(`cd ${opts.target}`)}`);
  info(`  ${c.cyan("pnpm install")}        ${c.dim("# or npm install / yarn")}`);
  info(`  ${c.cyan("pnpm dev")}            ${c.dim("# set VITE_PROXY_TARGET in .env.local to your Django origin")}`);
  info(`\n${c.dim("Docs: https://docs.conjure.terracelab.co.kr")}\n`);
}

main();
