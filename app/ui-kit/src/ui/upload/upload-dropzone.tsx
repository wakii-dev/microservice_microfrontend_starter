// UploadDropzone — biến thể kéo-thả của Upload (export từ index): border-dashed rounded-lg +
// icon upload + hint 'Kéo thả hoặc click để chọn'. dragenter/dragover → border-accent + bg tint
// (state class); dragleave/drop → thường. Drop đọc e.dataTransfer.files; click mở dialog;
// role=button + tabIndex — Enter/Space mở dialog, aria-disabled khi disabled.
// Chia sẻ props + controller với Upload qua upload-core.
// Customize pass (slots wave 3): slot dropzone + list slots (upload-core) —
// default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { Icon } from '../icons/index.js';
import { UploadFileList, useUploadController, type UploadProps } from './upload-core.js';

const BASE =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-s2 px-6 py-8 text-center text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
// dragenter/dragover — viền + nền tint accent (bg-accent/8 theo pattern sidebar bg-accent/20)
const HIGHLIGHT = 'border-accent bg-accent/8 text-accent';
const DISABLED = 'cursor-not-allowed opacity-60';

export function UploadDropzone(props: UploadProps) {
<<<<<<< Updated upstream
  const { accept, multiple, disabled, showList = true, progressVariant = 'bar', className, children } = props;
  const { inputRef, openDialog, items, removeItem, handleFiles, retryItem, onInputChange } = useUploadController(props);
=======
  const { accept, multiple, disabled, showList = true, className, style } = props;
  const slots = props.classNames;
  const { inputRef, openDialog, items, removeItem, handleFiles, onInputChange } = useUploadController(props);
>>>>>>> Stashed changes
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(Array.from(event.dataTransfer?.files ?? [])); // handleFiles tự guard disabled
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openDialog();
  };

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
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={classNames(BASE, disabled ? DISABLED : dragging ? HIGHLIGHT : '', slots?.dropzone)}
        onClick={openDialog}
        onKeyDown={onKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        {props.children ?? (
          <>
            <span className="text-ink3" aria-hidden="true">
              <Icon name="upload" size={28} />
            </span>
            <span className="text-body">Kéo thả hoặc click để chọn</span>
          </>
        )}
      </div>
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
