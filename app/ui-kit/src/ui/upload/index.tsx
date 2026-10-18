// Upload — hidden input[type=file] + trigger button + danh sách file (tên + size KB/MB + × remove),
// spec batch ③ worker B (VU-53). Status per file nội bộ: beforeUpload false → không add;
// Promise → 'uploading' (Progress) → 'done'/'error'. UploadDropzone (kéo-thả) chia sẻ props/logic
// qua upload-core; Logic chọn file nằm ở useUploadController (upload-core.tsx).
import { Button } from '../button/index';
import { UploadFileList, useUploadController, type UploadProps } from './upload-core.js';
import { UploadDropzone } from './upload-dropzone.js';

export { UploadDropzone } from './upload-dropzone.js';
export type { UploadItem, UploadProps, UploadStatus } from './upload-core.js';

const TRIGGER_ICON = (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" strokeLinecap="round" />
  </svg>
);

export function Upload(props: UploadProps) {
  const { accept, multiple, disabled, showList = true, className, children } = props;
  const { inputRef, openDialog, items, removeItem, onInputChange } = useUploadController(props);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={onInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      {children ?? (
        <Button type="default" disabled={disabled} onClick={openDialog} icon={TRIGGER_ICON}>
          Chọn tệp
        </Button>
      )}
      {showList && <UploadFileList items={items} onRemove={removeItem} />}
    </div>
  );
}
