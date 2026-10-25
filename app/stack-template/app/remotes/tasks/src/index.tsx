// Standalone entry — CHỈ để debug remote đứng mình (:4001). Khi load trong shell, entry này
// KHÔNG chạy (shell import expose './TasksPage' trực tiếp qua Module Federation).
//
// Async boundary BẮT BUỘC (RUNTIME-006, như shell bootstrap): entry KHÔNG được import
// shared (react/jsx-runtime qua JSX, CSS chunk machinery) tĩnh — share scope phải init
// xong trước. Thiếu boundary → "Invalid loadShareSync" → root trống đen (spike R2 SF-1
// bắt được; docker cũ cũng dính — standalone đã chết từ trước, không chỉ "trơ trụi").
// SF-3 sẽ TIẾP TỤC sửa file render (banner debug) — GIỮ import CSS trong standalone.tsx.
import('./standalone').catch((err: unknown) => {
  // Chunk/CSS load fail → root trống im lặng (cùng class RUNTIME-006) — hiển thị ra luôn
  document.body.textContent = `Standalone load fail: ${err instanceof Error ? err.message : String(err)}`;
});
