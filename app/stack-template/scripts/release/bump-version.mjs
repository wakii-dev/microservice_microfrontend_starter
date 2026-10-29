#!/usr/bin/env node
// ============================================================================
// bump-version.mjs — tăng version + sinh CHANGELOG entry từ commit range.
// Dùng bởi CI workflow `publish-packages` (job bump); chạy tay được để debug:
//   node scripts/release/bump-version.mjs --package ui-kit --type patch [--dry-run] [--json]
//                                            [--skip-registry-check]
//
// Rules:
//  - KHÔNG BAO GIỜ đè version đã tồn tại trên registry: nếu target đã có trong
//    `npm view <name> versions` HOẶC target <= dist-tags.latest → exit 2 (skip
//    sạch, không sửa file — main package.json đang stale so với registry).
//  - CHANGELOG entry tự sinh từ commit range: base = commit ĐẶT version hiện tại
//    (git log -S'"version": "<old>"' — đã verify bắt đúng cho cả 3 package),
//    range = BASE..HEAD scoped vào app/<pkg>/.
//  - Exit code: 0 = đã bump (hoặc --dry-run) · 2 = skip sạch · 1 = lỗi.
//  - Output contract repo: --json → stdout PURE JSON (human summary xuống stderr).
// ============================================================================

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function die(msg, code = 1) {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(code);
}

// ---- args ------------------------------------------------------------------
const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const pkgDirName = argValue('--package');
const bumpType = argValue('--type');
const dryRun = args.includes('--dry-run');
const skipRegistry = args.includes('--skip-registry-check');
const jsonOut = args.includes('--json');

if (!pkgDirName || !bumpType) {
  die('usage: bump-version.mjs --package <ui-kit|create-wakii-app|create-wakii-stack> --type <patch|minor|major> [--dry-run] [--json] [--skip-registry-check]');
}
if (!['patch', 'minor', 'major'].includes(bumpType)) die(`--type phải là patch|minor|major (nhận: ${bumpType})`);

// ---- locate repo + package -------------------------------------------------
const repoRoot = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim();
if (!repoRoot) die('không chạy được trong git repo');
process.chdir(repoRoot);

const pkgDir = path.join(repoRoot, 'app', pkgDirName);
const pkgJsonPath = path.join(pkgDir, 'package.json');
if (!fs.existsSync(pkgJsonPath)) die(`không tìm thấy ${path.relative(repoRoot, pkgJsonPath)}`);
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const name = pkg.name;
const oldVersion = pkg.version;

// ---- semver bump + compare (0 deps) ----------------------------------------
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) die(`version '${v}' không phải X.Y.Z (prerelease chưa hỗ trợ)`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function bump([maj, min, pat]) {
  if (bumpType === 'major') return `${maj + 1}.0.0`;
  if (bumpType === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}
function cmpSemver(a, b) {
  const [a1, a2, a3] = parseSemver(a);
  const [b1, b2, b3] = parseSemver(b);
  return a1 - b1 || a2 - b2 || a3 - b3;
}
const target = bump(parseSemver(oldVersion));

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout;
}

// ---- registry guard: KHÔNG đè version tồn tại ------------------------------
let registryLatest = null;
let registryChecked = false;
if (!skipRegistry) {
  const raw = run('npm', ['view', name, '--json']);
  if (raw === null) {
    process.stderr.write(`⚠ npm view ${name} thất bại (offline / package chưa có trên registry) — bỏ qua guard registry\n`);
  } else {
    registryChecked = true;
    let info;
    try { info = JSON.parse(raw); } catch { die('npm view trả JSON không parse được'); }
    const versions = Array.isArray(info.versions) ? info.versions.map(String) : [];
    registryLatest = info['dist-tags']?.latest ?? null;
    if (versions.includes(target)) {
      const out = { ok: true, skipped: true, reason: `target ${target} ĐÃ TỒN TẠI trên registry — main package.json stale (đang ${oldVersion}). Bump version trên main trước khi publish.`, package: pkgDirName, name, old: oldVersion, target, registry_latest: registryLatest };
      process.stderr.write(`⏭ SKIP — ${out.reason}\n`);
      if (jsonOut) process.stdout.write(JSON.stringify(out) + '\n');
      process.exit(2);
    }
    if (registryLatest && cmpSemver(target, registryLatest) <= 0) {
      const out = { ok: true, skipped: true, reason: `target ${target} <= registry latest ${registryLatest} — publish sẽ tạo version chết. Bump version trên main (đang ${oldVersion}) lên trên ${registryLatest} trước.`, package: pkgDirName, name, old: oldVersion, target, registry_latest: registryLatest };
      process.stderr.write(`⏭ SKIP — ${out.reason}\n`);
      if (jsonOut) process.stdout.write(JSON.stringify(out) + '\n');
      process.exit(2);
    }
  }
}

// ---- commit range (BASE = commit đặt version hiện tại) ----------------------
const versionNeedle = `"version": "${oldVersion}"`;
const baseSha = run('git', ['log', '-n1', '--format=%H', `-S${versionNeedle}`, '--', `app/${pkgDirName}/package.json`])?.trim() || null;
const headSha = run('git', ['rev-parse', 'HEAD'])?.trim();
const rangeSpec = baseSha ? `${baseSha}..${headSha}` : headSha;
const logRaw = run('git', ['log', '--format=%h%x09%s', rangeSpec, '--', `app/${pkgDirName}/`]) ?? '';
let commits = logRaw.split('\n').filter(Boolean).map((l) => {
  const [hash, ...rest] = l.split('\t');
  return { hash, subject: rest.join('\t') };
});
if (commits.length > 30) commits = commits.slice(0, 30);

// ---- CHANGELOG entry --------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const bulletLines = commits.length
  ? commits.map((c) => `- ${c.hash} ${c.subject}`)
  : [`- (không có commit chạm app/${pkgDirName}/ trong range ${baseSha ? baseSha.slice(0, 7) : 'root'}..${headSha.slice(0, 7)} — bump only)`];
const entry = [
  `## [${target}] — ${today}`,
  '',
  `### Changed (auto — ${baseSha ? baseSha.slice(0, 7) : 'root'}..${headSha.slice(0, 7)} qua CI workflow publish-packages)`,
  '',
  ...bulletLines,
  '',
].join('\n');

const changelogPath = path.join(pkgDir, 'CHANGELOG.md');
const changelogExisted = fs.existsSync(changelogPath);
let changelogNext;
if (!changelogExisted) {
  changelogNext = `# Changelog — ${name}\n\n${entry}`;
} else {
  const raw = fs.readFileSync(changelogPath, 'utf8');
  const lines = raw.split('\n');
  const firstEntryIdx = lines.findIndex((l) => /^## \[/.test(l));
  if (firstEntryIdx === -1) {
    changelogNext = raw.replace(/\n*$/, '\n\n') + entry;
  } else {
    lines.splice(firstEntryIdx, 0, ...entry.split('\n').slice(0, -1));
    changelogNext = lines.join('\n');
  }
}

// ---- writes ----------------------------------------------------------------
const pkgRaw = fs.readFileSync(pkgJsonPath, 'utf8');
const needle = `"version": "${oldVersion}"`;
if (!pkgRaw.includes(needle)) die(`package.json không chứa ${needle} (format bất thường?)`);
const pkgNext = pkgRaw.replace(needle, `"version": "${target}"`);

let written = false;
if (!dryRun) {
  fs.writeFileSync(pkgJsonPath, pkgNext);
  fs.writeFileSync(changelogPath, changelogNext);
  written = true;
}

const out = {
  ok: true,
  skipped: false,
  package: pkgDirName,
  name,
  type: bumpType,
  old: oldVersion,
  target,
  registry_checked: registryChecked,
  registry_latest: registryLatest,
  base: baseSha,
  range: rangeSpec,
  commits: commits.map((c) => `${c.hash} ${c.subject}`),
  changelog_path: path.relative(repoRoot, changelogPath),
  changelog_created: !changelogExisted,
  dry_run: dryRun,
  written,
};
process.stderr.write(`✓ ${name} ${oldVersion} → ${target} (${bumpType})${dryRun ? ' — DRY RUN, không ghi file' : ' — đã ghi package.json + CHANGELOG'}\n`);
if (jsonOut) process.stdout.write(JSON.stringify(out) + '\n');
