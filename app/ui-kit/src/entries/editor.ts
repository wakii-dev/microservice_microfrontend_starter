// Entry subpath 'wakii-ui-kit/editor' (batch ⑩) — import riêng Editor (tiptap) không qua
// barrel chính. Tiptap không có CSS import tĩnh (style qua prose classes) → pure re-export;
// nếu sau này thêm CSS editor thì để tại ĐÂY.
export { Editor, type EditorProps } from '../ui/editor/index.js';
