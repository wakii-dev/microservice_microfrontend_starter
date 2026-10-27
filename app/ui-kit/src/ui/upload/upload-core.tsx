// upload-core — logic + types dùng chung Upload & UploadDropzone (batch ③ worker B, VU-53):
// useUploadController (hidden input, openDialog, hàng đợi file nội bộ có status per file),
// UploadFileList (tên + size KB/MB + × remove). Tách riêng để index ↔ dropzone không import chéo.
// Status per file: beforeUpload false → chặn; Promise → 'uploading' (Progress ticker display-only)
// → resolve true 'done' / resolve false gỡ dòng / reject 'error' (+ reason hiển thị, retry).
// Per-file callbacks (mission overlay-api): onItemDone/onItemError bắn khi MỖI file xong/lỗi.
// Customize pass (slots wave 3): classNames slots (root/dropzone/list/listItem/
// listRemove) + style passthrough — default path (không truyền) giữ nguyên DOM.
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import cx from 'classnames';
import { Icon } from '../icons/index.js';
import { Progress } from '../progress/index';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  /** 0–100 — đang upload async, UploadFileList render Progress (bar hoặc ring). */
  progress?: number;
  /** Lý do lỗi (message của reject) — status='error', UploadFileList hiển thị cạnh "Lỗi". */
  error?: string;
}

/** Slot classes kiểu antd v5 (slots wave 3) — dùng chung Upload & UploadDropzone. */
export interface UploadClassNames {
  /** Div gốc bọc input + trigger + list — cùng element với className prop. */
  root?: string;
  /** Div role=button vùng kéo-thả (chỉ UploadDropzone dùng). */
  dropzone?: string;
  /** <ul> danh sách file. */
  list?: string;
  /** <li> mỗi file trong list. */
  listItem?: string;
  /** Button × xoá mỗi file. */
  listRemove?: string;
}

export interface UploadProps {
  /** attr accept của input file, vd '.pdf,image/*'. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Giới hạn tổng số file giữ lại — phần thừa bị chặn. */
  maxCount?: number;
  /** false (đồng bộ) → chặn file; Promise resolve false → chặn; resolve true → done; reject → error. */
  beforeUpload?: (file: File, files: File[]) => boolean | Promise<boolean>;
  /** Danh sách file hiện có vừa đổi (add/remove). */
  onChange?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  /** Bắn khi MỖI file xong (status → 'done': add đồng bộ lẫn Promise resolve true). */
  onItemDone?: (item: UploadItem) => void;
  /** Bắn khi MỖI file lỗi (Promise reject) — reason là message của lỗi. */
  onItemError?: (item: UploadItem, reason: string) => void;
  /** Kiểu progress khi đang upload (mặc định 'bar'; 'ring' = SVG vòng tròn). */
  progressVariant?: 'bar' | 'ring';
  /** Ẩn/hiện danh sách file — mặc định true. */
  showList?: boolean;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: UploadClassNames;
  /** Trigger tuỳ chỉnh thay button mặc định (dropzone dùng children thay hint). */
  children?: ReactNode;
}

/** 100 → '100 B', 2048 → '2.0 KB', 1.5MB → '1.5 MB'. */
// eslint-disable-next-line react-refresh/only-export-components
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

let uid = 0;
const nextId = () => `upload-${++uid}`;

/** Máy chọn file dùng chung: input ref + openDialog + hàng đợi items + beforeUpload/maxCount. */
// eslint-disable-next-line react-refresh/only-export-components
export function useUploadController(props: UploadProps) {
  const { disabled, multiple, maxCount, beforeUpload, onChange, onRemove } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItemsState] = useState<UploadItem[]>([]);
  // Mirror đồng bộ — beforeUpload async cần đọc danh sách mới nhất giữa các tick
  const itemsRef = useRef<UploadItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setInterval>>());

  // Callback qua ref — handler luôn gọi bản mới nhất, không stale closure
  const beforeUploadRef = useRef(beforeUpload);
  const onChangeRef = useRef(onChange);
  const onRemoveRef = useRef(onRemove);
  const onItemDoneRef = useRef(props.onItemDone);
  const onItemErrorRef = useRef(props.onItemError);
  useEffect(() => {
    beforeUploadRef.current = beforeUpload;
    onChangeRef.current = onChange;
    onRemoveRef.current = onRemove;
    onItemDoneRef.current = props.onItemDone;
    onItemErrorRef.current = props.onItemError;
  });

  // unmount → dọn ticker progress
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearInterval(timer));
      timers.clear();
    };
  }, []);

  const patch = (next: UploadItem[]) => {
    itemsRef.current = next;
    setItemsState(next);
  };

  const emitChange = (list: UploadItem[]) => {
    onChangeRef.current?.(list.map((item) => item.file));
  };

  const clearTimer = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(id);
    }
  };

  // Nhánh async của handleFiles (hoặc retryItem khi truyền `existing` — giữ nguyên dòng)
  const trackPromise = async (file: File, pending: Promise<boolean>, existing?: UploadItem) => {
    const id = existing?.id ?? nextId();
    if (existing) {
      patch(
        itemsRef.current.map((item) =>
          item.id === id ? { ...item, status: 'uploading' as const, progress: 0, error: undefined } : item,
        ),
      );
    } else {
      patch([...itemsRef.current, { id, file, status: 'uploading', progress: 0 }]);
      emitChange(itemsRef.current);
    }
    // Ticker giả progress (display-only) — kết quả thật do Promise quyết định
    const timer = setInterval(() => {
      patch(
        itemsRef.current.map((item) =>
          item.id === id ? { ...item, progress: Math.min(90, (item.progress ?? 0) + 7) } : item,
        ),
      );
    }, 150);
    timersRef.current.set(id, timer);
    try {
      const ok = await pending;
      clearTimer(id);
      if (!ok) {
        // resolve false → chặn: gỡ dòng 'uploading'
        patch(itemsRef.current.filter((item) => item.id !== id));
        emitChange(itemsRef.current);
        return;
      }
      const doneItem: UploadItem = { id, file, status: 'done', progress: 100 };
      patch(itemsRef.current.map((item) => (item.id === id ? doneItem : item)));
      onItemDoneRef.current?.(doneItem);
    } catch (reason) {
      clearTimer(id);
      const text = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Không rõ nguyên nhân';
      const errorItem: UploadItem = { id, file, status: 'error', error: text };
      patch(itemsRef.current.map((item) => (item.id === id ? errorItem : item)));
      onItemErrorRef.current?.(errorItem, text);
    }
  };

  // Chạy lại beforeUpload cho 1 dòng lỗi — giữ nguyên vị trí/id trong list
  const retryItem = (item: UploadItem) => {
    if (disabled) return;
    const beforeUploadFn = beforeUploadRef.current;
    if (!beforeUploadFn) return; // không có đường upload (beforeUpload) → không retry được
    const others = itemsRef.current.filter((it) => it.id !== item.id).map((it) => it.file);
    void trackPromise(item.file, Promise.resolve(beforeUploadFn(item.file, others)), item);
  };

  const handleFiles = (incoming: File[]) => {
    if (disabled) return; // disabled → bỏ qua cả input change lẫn drop
    // multiple=false → chỉ file đầu; maxCount chặn phần thừa trên tổng đang giữ
    const candidates = multiple ? incoming : incoming.slice(0, 1);
    let added = 0;
    for (const file of candidates) {
      if (maxCount != null && itemsRef.current.length >= maxCount) break;
      const result = beforeUploadRef.current?.(file, itemsRef.current.map((item) => item.file));
      if (result === false) continue; // chặn — không add
      if (result instanceof Promise) {
        void trackPromise(file, result);
        continue;
      }
      const doneItem: UploadItem = { id: nextId(), file, status: 'done' };
      patch([...itemsRef.current, doneItem]);
      onItemDoneRef.current?.(doneItem); // add đồng bộ → file xong ngay
      added++;
    }
    if (added > 0) emitChange(itemsRef.current); // 1 batch chọn file → 1 onChange
  };

  const openDialog = () => {
    if (disabled) return; // disabled → không mở dialog
    inputRef.current?.click();
  };

  const removeItem = (item: UploadItem) => {
    patch(itemsRef.current.filter((it) => it.id !== item.id));
    onRemoveRef.current?.(item.file);
    emitChange(itemsRef.current);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files ?? []));
    event.target.value = ''; // cho phép chọn lại cùng 1 file
  };

  return { inputRef, openDialog, items, removeItem, handleFiles, retryItem, onInputChange };
}

function UploadProgressRing({ item }: { item: UploadItem }) {
  const clamped = Math.min(100, Math.max(0, item.progress ?? 0));
  const radius = 8; // viewBox 20 — stroke 2, tâm (10,10)
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Đang tải ${item.file.name}`}
      viewBox="0 0 20 20"
      className="size-5 shrink-0 -rotate-90"
    >
      <circle cx="10" cy="10" r={radius} fill="none" strokeWidth="2" style={{ stroke: 'var(--line2)' }} />
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped / 100)}
        style={{ stroke: 'var(--accent)', transition: 'stroke-dashoffset 200ms' }}
      />
    </svg>
  );
}

/** Danh sách file: tên + size + Progress bar/ring (đang upload) / ✓ (done) / Lỗi (+reason,
 * nút retry khi truyền onRetry) + × remove. Slots list/listItem/listRemove (slots wave 3). */
export function UploadFileList({
  items,
  onRemove,
  onRetry,
  progressVariant = 'bar',
  classNames,
}: {
  items: UploadItem[];
  onRemove: (item: UploadItem) => void;
  /** Truyền thì dòng lỗi có nút "Thử lại" — chạy lại beforeUpload cho file đó. */
  onRetry?: (item: UploadItem) => void;
  /** 'bar' (mặc định, fallback) hoặc 'ring' — SVG vòng tròn gọn cho dòng file. */
  progressVariant?: 'bar' | 'ring';
  /** Slots list/listItem/listRemove — threads từ UploadClassNames (slots wave 3). */
  classNames?: Pick<UploadClassNames, 'list' | 'listItem' | 'listRemove'>;
}) {
  // prop `classNames` che hàm merge — alias import `cx`; variant default đã ở destructure
  const slots = classNames;
  if (items.length === 0) return null;
  return (
    <ul className={cx('mt-2 flex list-none flex-col gap-1 p-0', slots?.list)}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cx('flex items-center gap-2 rounded-lg border border-line bg-s2 px-3 py-2 text-body text-ink', slots?.listItem)}
        >
          <span className="shrink-0 text-ink3" aria-hidden="true">
            <Icon name="file" size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
          <span className="shrink-0 text-meta text-ink3">{formatSize(item.file.size)}</span>
          {item.status === 'uploading' && item.progress != null && (
            progressVariant === 'ring' ? (
              <UploadProgressRing item={item} />
            ) : (
              <Progress percent={item.progress} showInfo={false} className="w-24 shrink-0" />
            )
          )}
          {item.status === 'done' && <span className="shrink-0 text-meta text-st-done"><Icon name="check" size={12} /></span>}
          {item.status === 'error' && (
            <>
              <span className="shrink-0 text-meta text-st-fail">Lỗi</span>
              {item.error && (
                <span className="min-w-0 shrink truncate text-meta text-st-fail/80" title={item.error}>
                  {item.error}
                </span>
              )}
              {onRetry && (
                <button
                  type="button"
                  aria-label={`Thử lại ${item.file.name}`}
                  className="shrink-0 cursor-pointer rounded-1 border border-line bg-transparent px-2 py-0.5 text-meta text-ink2 hover:border-accent hover:text-accent"
                  onClick={() => onRetry(item)}
                >
                  Thử lại
                </button>
              )}
            </>
          )}
          <button
            type="button"
            aria-label={`Xoá ${item.file.name}`}
            className={cx('shrink-0 cursor-pointer rounded-1 border-0 bg-transparent p-1 text-ink3 hover:text-st-fail', slots?.listRemove)}
            onClick={() => onRemove(item)}
          >
            <Icon name="times" size={12} />
          </button>
        </li>
      ))}
    </ul>
  );
}
