#!/usr/bin/env node
// wakii-team-watch — runtime giám sát đội AI (pattern từ hang-watchdog của Wakii/Orca:
// heartbeat + tick + phát hiện/đã-khỏi, tôn trọng system-sleep qua tick-gap guard).
// 0-dep. Nguồn chân lý: HEALTH.json (render được bằng <TeamDashboard> của kit).
import { execFile } from 'node:child_process';
import { writeFile, readFile, stat, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();
const INTERVAL_MS = Number(process.env.WTW_INTERVAL ?? 30_000);
const IDLE_MS = 120_000;        // 1 terminal im >2 phút
const STALL_MS = 480_000;       // im >8 phút = nghi stall
const THROTTLE_N = 3;           // ≥3 terminal im đồng loạt = nghi throttle
const FS_PROOF_MIN = 10 * 60;   // bằng chứng filesystem 10 phút
const NOTIFY = process.env.WTW_NOTIFY !== '0';
const run = (cmd, args) => new Promise((res) => execFile(cmd, args, { timeout: 20_000 }, (e, so) => res(e ? null : so)));

async function orcaTerminals() {
  const out = await run('orca', ['terminal', 'list', '--json']);
  if (!out) return [];
  try { return JSON.parse(out).result?.terminals ?? []; } catch { return []; }
}
async function readLastLine(handle) {
  const out = await run('orca', ['terminal', 'read', '--terminal', handle, '--json']);
  if (!out) return null;
  try {
    const tail = JSON.parse(out).result?.terminal?.tail ?? [];
    const lines = tail.filter((l) => l && l.trim());
    return lines[lines.length - 1]?.trim() ?? '';
  } catch { return null; }
}
const isIdleLine = (l) => !l || l === '❯' || /bypass permissions on|accept edits on|auto mode on|new task\?/.test(l);
async function fsProof() {
  const src = path.join(ROOT, 'src');
  if (!existsSync(src)) return 0;
  const cutoff = Date.now() - FS_PROOF_MIN * 1000;
  let hits = 0;
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else { const s = await stat(p).catch(() => null); if (s && s.mtimeMs > cutoff) hits++; }
    }
  }
  await walk(src);
  return hits;
}
async function inboxBacklog(inboxDir) {
  if (!existsSync(inboxDir)) return 0;
  let undelivered = 0;
  for (const f of await readdir(inboxDir)) {
    if (!f.endsWith('.md')) continue;
    const txt = await readFile(path.join(inboxDir, f), 'utf8').catch(() => '');
    undelivered += (txt.match(/^\[.*?\] @.*$/gm) ?? []).filter((l) => !l.includes('(delivered)')).length;
  }
  return undelivered;
}
function notify(title, msg) {
  if (!NOTIFY) return;
  const esc = (s) => s.replaceAll('"', '\\"');
  if (process.platform === 'darwin') run('osascript', ['-e', `display notification "${esc(msg)}" with title "${esc(title)}"`]);
  else if (process.platform === 'linux') run('notify-send', [title, msg]);
}
let lastAlertKey = '';
let lastTickAt = Date.now();

async function cycle() {
  const now = Date.now();
  // tick-gap guard: process ngủ/máy sleep → không báo nhầm
  if (now - lastTickAt > INTERVAL_MS * 3) { lastTickAt = now; return; }
  lastTickAt = now;
  const terms = (await orcaTerminals()).filter((t) => t.handle && !t.orphaned);
  const agents = [];
  for (const t of terms) {
    const age = (now - (t.lastOutputAt ?? 0)) / 1000;
    const last = age < STALL_MS ? await readLastLine(t.handle) : null; // tiết kiệm call khi rõ stall
    const wt = (t.worktreePath ?? '').split('/').filter(Boolean).pop() ?? '';
    agents.push({
      handle: t.handle.slice(5, 13),
      worktree: wt || '(primary)',
      branch: (t.branch ?? '').replace('refs/heads/', '') || '-',
      title: (t.title ?? '').slice(0, 30),
      activity: ((t.preview ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)) || (last ?? '').slice(0, 60),
      ageS: Math.round(age),
      state: age > STALL_MS / 1000 ? 'stall-suspect' : isIdleLine(last) ? 'idle' : 'working',
    });
  }
  // gom theo worktree — nhìn thấy ngay dự án nào đang có người làm
  const byWorktree = {};
  for (const a of agents) (byWorktree[a.worktree] ??= []).push(a.state);
  const idle = agents.filter((a) => a.state === 'idle');
  const stalls = agents.filter((a) => a.state === 'stall-suspect');
  const working = agents.filter((a) => a.state === 'working');
  const fsRecent = await fsProof();
  const mailBacklog = await inboxBacklog(path.join(ROOT, 'docs/team/inbox'));
  const throttleSuspect = idle.length + stalls.length >= THROTTLE_N && fsRecent === 0;
  const health = { at: new Date().toISOString(), byWorktree, mode: throttleSuspect ? 'THROTTLE-SUSPECT (giảm đội hình!)' : working.length > 0 ? 'OK' : 'QUIET', agents, stats: { working: working.length, idle: idle.length, stall: stalls.length, fsFiles10m: fsRecent, mailBacklog }, trips: [] };
  if (idle.length) health.trips.push(`IDLE: ${idle.map((a) => a.handle).join(',')}`);
  if (stalls.length) health.trips.push(`STALL: ${stalls.map((a) => a.handle).join(',')}`);
  if (mailBacklog) health.trips.push(`MAIL-BACKLOG x${mailBacklog}`);
  if (throttleSuspect) health.trips.push('THROTTLING — chuyển chế độ TẬP-TRUNG/TRỰC-TIẾP');
  await mkdir(path.join(ROOT, 'docs/team'), { recursive: true });
  await writeFile(path.join(ROOT, 'docs/team/HEALTH.json'), JSON.stringify(health, null, 1) + '\n');
  const key = health.trips.join('|');
  if (key && key !== lastAlertKey) { notify('wakii-team-watch', health.trips[0] ?? ''); lastAlertKey = key; }
  if (!key) lastAlertKey = '';
  
  const wtLine = Object.entries(byWorktree).map(([w, st]) => `${w}[${st.filter((x) => x === 'working').length}/${st.length}]`).join(' ');
  console.log(`[${health.at.slice(11, 19)}] ${health.mode} - ${wtLine} - lam=${working.length} nghi=${idle.length} treo=${stalls.length} fs10m=${fsRecent} thu=${mailBacklog} ${health.trips.join(' | ')}`);
}

console.log(`wakii-team-watch khởi động · root=${ROOT} · mỗi ${INTERVAL_MS / 1000}s (Ctrl+C dừng)`);
await cycle();
setInterval(() => { cycle().catch(() => {}); }, INTERVAL_MS);
