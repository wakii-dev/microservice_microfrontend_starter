// Upload — hidden input[type=file] + trigger button + danh sách file (tên + size KB/MB + × remove),
// spec batch ③ worker B (VU-53). Status per file nội bộ: beforeUpload false → không add;
// Promise → 'uploading' (Progress) → 'done'/'error'. UploadDropzone (kéo-thả) chia sẻ props/logic
// qua upload-core; Logic chọn file nằm ở useUploadController (upload-core.tsx).
import { Button } from '../button/index';
import { Icon } from '../icons/index.js';
import { UploadFileList, useUploadController, type UploadProps } from './upload-core.js';

export { UploadDropzone } from './upload-dropzone.js';
export type { UploadItem, UploadProps, UploadStatus } from './upload-core.js';

const TRIGGER_ICON = <Icon name="upload" size={14} />;

export function Upload(props: UploadProps) {
  const { accept, multiple, disabled, showList = true, progressVariant = 'bar', className, children } = props;
  const { inputRef, openDialog, items, removeItem, retryItem, onInputChange } = useUploadController(props);

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
      {showList && (
        <UploadFileList items={items} onRemove={removeItem} onRetry={retryItem} progressVariant={progressVariant} />
      )}
    </div>
  );
}
