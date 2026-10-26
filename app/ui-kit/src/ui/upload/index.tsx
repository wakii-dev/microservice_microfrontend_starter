// Upload — hidden input[type=file] + trigger button + danh sách file (tên + size KB/MB + × remove),
// spec batch ③ worker B (VU-53). Status per file nội bộ: beforeUpload false → không add;
// Promise → 'uploading' (Progress) → 'done'/'error'. UploadDropzone (kéo-thả) chia sẻ props/logic
// qua upload-core; Logic chọn file nằm ở useUploadController (upload-core.tsx).
import classNames from 'classnames';
import { Button } from '../button/index';
import { Icon } from '../icons/index.js';
import { UploadFileList, useUploadController, type UploadProps } from './upload-core.js';

export { UploadDropzone } from './upload-dropzone.js';
export type { UploadItem, UploadProps, UploadStatus, UploadClassNames } from './upload-core.js';

const TRIGGER_ICON = <Icon name="upload" size={14} />;

export function Upload(props: UploadProps) {
<<<<<<< Updated upstream
  const { accept, multiple, disabled, showList = true, progressVariant = 'bar', className, children } = props;
  const { inputRef, openDialog, items, removeItem, retryItem, onInputChange } = useUploadController(props);
=======
  const { accept, multiple, disabled, showList = true, className, style } = props;
  const slots = props.classNames;
  const { inputRef, openDialog, items, removeItem, onInputChange } = useUploadController(props);
>>>>>>> Stashed changes

  return (
    <div className={classNames(slots?.root, className)} style={style}>
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
      {props.children ?? (
        <Button type="default" disabled={disabled} onClick={openDialog} icon={TRIGGER_ICON}>
          Chọn tệp
        </Button>
      )}
      {showList && (
<<<<<<< Updated upstream
        <UploadFileList items={items} onRemove={removeItem} onRetry={retryItem} progressVariant={progressVariant} />
=======
        <UploadFileList
          items={items}
          onRemove={removeItem}
          classNames={slots && { list: slots.list, listItem: slots.listItem, listRemove: slots.listRemove }}
        />
>>>>>>> Stashed changes
      )}
    </div>
  );
}
