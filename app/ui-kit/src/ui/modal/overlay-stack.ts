// overlay-stack — sổ đăng ký overlay dùng chung Modal ↔ Drawer (mission overlay-api):
// (1) ESC chỉ đóng overlay TRÊN CÙNG — Modal trong Drawer, ESC không đóng cả hai;
// (2) scroll-lock body đếm tham chiếu — unmount 1 lớp KHÔNG nhả lock của lớp ngoài
//     (trước đây cleanup `overflow=''` của modal con ghi đè lock drawer — stories đợt 3).
// "Trên cùng" xếp theo THỨ TỰ DOM của portal root (mask) — trùng đúng z-order thật
// (portal append vào body sau = vẽ đè lên), không phụ thuộc thứ tự effect mount
// (modal con là React-child của drawer nên effect của nó luôn chạy TRƯỚC — không
// dùng được làm thứ tự stack).
// Vòng đời tách 2 pha: mount → acquire (đăng ký + lock); open=false (bắt đầu
// animate-out) → detach (ngưng tính là overlay active ngay, ESC rơi xuống lớp dưới)
// nhưng LOCK GIỮ đến release lúc unmount (exit animation xong); mở lại giữa
// animation → reattach.

const roots = new Map<symbol, HTMLElement>(); // token → portal root (mask) — sống đến release
const active = new Set<symbol>(); // token đang mở (open && mounted) — ESC chỉ xem tập này
let lockCount = 0;
let prevOverflow = '';

/** Mount overlay: đăng ký portal root + tăng refcount lock; 0→1 thì khoá body (giữ overflow sẵn có). */
export function acquireOverlay(root: HTMLElement): symbol {
  const token = Symbol('overlay');
  roots.set(token, root);
  active.add(token);
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
  return token;
}

/** Bắt đầu đóng: ngưng tính active ngay — isTopOverlay=false với lớp đang animate-out. */
export function detachOverlay(token: symbol): void {
  active.delete(token);
}

/** Mở lại giữa exit animation (open=true trước khi unmount): tính active lại. */
export function reattachOverlay(token: symbol): void {
  if (roots.has(token)) active.add(token);
}

/** Unmount: huỷ đăng ký + giảm refcount; về 0 thì nhả lock về overflow ban đầu. */
export function releaseOverlay(token: symbol): void {
  active.delete(token);
  roots.delete(token);
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = prevOverflow;
}

/** Overlay này có phải overlay TRÊN CÙNG không — so vị trí DOM với mọi overlay active khác:
 * portal nào nằm SAU nó trong document (vẽ đè lên nó) thì nó không phải top. */
export function isTopOverlay(token: symbol): boolean {
  const self = roots.get(token);
  if (!self || !active.has(token)) return false;
  for (const other of active) {
    if (other === token) continue;
    const otherRoot = roots.get(other);
    if (otherRoot && self.compareDocumentPosition(otherRoot) & Node.DOCUMENT_POSITION_FOLLOWING) return false;
  }
  return true;
}
