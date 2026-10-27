// io.mjs — file helpers cho generators: đọc/ghi có guard, chèn giữa marker.
// Tất cả ghi file qua writeIfAbsent/writeNew — KHÔNG bao giờ đè file có sẵn
// (idempotent-guard: tồn tại → lỗi rõ, người chạy quyết định).
import fs from 'node:fs';
import path from 'node:path';

export function exists(p) {
  return fs.existsSync(p);
}

export function isDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

export function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

/** Ghi ĐÈ có chủ đích — CHỈ cho hàm chèn vào file có sẵn (compose/nginx/env). */
export function writeText(p, content) {
  fs.writeFileSync(p, content);
  return p;
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** Ghi file MỚI — tồn tại sẵn thì throw (idempotent-guard mission: "tồn tại → lỗi rõ"). */
export function writeNew(file, content) {
  if (fs.existsSync(file)) {
    throw new Error(`đã tồn tại, không đè: ${file} (xoá tay nếu muốn sinh lại)`);
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return file;
}

/** Ghi nhiều file {relPath: content} dưới rootDir. Trả danh sách path đã ghi. */
export function writeTree(rootDir, files) {
  const written = [];
  for (const [rel, content] of Object.entries(files)) {
    written.push(writeNew(path.join(rootDir, rel), content));
  }
  return written;
}

/**
 * Chèn `block` NGAY TRƯỚC dòng `anchor` (khớp literal, giữ indent của anchor).
 * Không tìm thấy anchor → null (caller quyết định lỗi hay fallback).
 */
export function insertBefore(text, anchor, block) {
  const idx = text.indexOf(anchor);
  if (idx === -1) return null;
  return text.slice(0, idx) + block + text.slice(idx);
}

/** Chèn `block` NGAY SAU dòng `anchor` (khớp literal). Không thấy → null. */
export function insertAfter(text, anchor, block) {
  const idx = text.indexOf(anchor);
  if (idx === -1) return null;
  return text.slice(0, idx + anchor.length) + block + text.slice(idx + anchor.length);
}

/**
 * Chèn content GIỮA cặp marker `open`/`close` (append vào cuối vùng).
 * Marker chưa tồn tại → tạo cặp mới tại `anchor` (dùng insertBefore semantics).
 * Trả { text, created: boolean } — null nếu không tìm thấy điểm chèn.
 */
export function insertIntoMarkers(text, { open, close, anchor, content }) {
  if (text.includes(open)) {
    if (!text.includes(close)) {
      throw new Error(`thấy marker mở "${open}" nhưng thiếu marker đóng "${close}" — sửa conf thủ công rồi chạy lại`);
    }
    // append vào cuối vùng marker (trước close)
    const closeIdx = text.indexOf(close);
    return { text: text.slice(0, closeIdx) + content + text.slice(closeIdx), created: false };
  }
  const block = `${open}\n${content}${close}\n`;
  const next = insertBefore(text, anchor, block);
  return next === null ? null : { text: next, created: true };
}
