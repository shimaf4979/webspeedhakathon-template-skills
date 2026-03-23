#!/usr/bin/env node
/**
 * 1 ファイルあたりの行数上限（要件の「200文字」は実務上ほぼ不可能なため、200行として扱う）
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_LINES = 200;
const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const IGNORE_DIR = new Set(["node_modules", ".svelte-kit", "build", "dist"]);
const EXT = new Set([".ts", ".js", ".mjs", ".svelte"]);

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE_DIR.has(e.name)) continue;
      await walk(p, out);
    } else if (e.isFile()) {
      const ext = extname(e.name);
      if (!EXT.has(ext)) continue;
      if (e.name.endsWith(".d.ts")) continue;
      out.push(p);
    }
  }
}

async function main() {
  const files = [];
  await walk(join(ROOT, "src"), files);
  await walk(join(ROOT, "fetch-timeline"), files);
  for (const name of ["fetch-timeline.mjs", "vite.config.ts", "svelte.config.js"]) {
    const p = join(ROOT, name);
    try {
      if ((await stat(p)).isFile()) files.push(p);
    } catch {
      /* optional */
    }
  }

  const bad = [];
  for (const f of files) {
    const text = await readFile(f, "utf8");
    const n = text.split(/\r?\n/).length;
    if (n > MAX_LINES) bad.push({ f: relative(ROOT, f), n });
  }

  if (bad.length > 0) {
    console.error(`各ファイル ${MAX_LINES} 行以内: 違反 ${bad.length} 件`);
    for (const b of bad.sort((a, b) => b.n - a.n)) console.error(`  ${b.n} 行\t${b.f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
