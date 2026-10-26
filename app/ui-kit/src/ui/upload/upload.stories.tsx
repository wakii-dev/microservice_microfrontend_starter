// upload.stories.tsx — Forms/Upload (batch ③ worker B): Upload cơ bản, file status
// done/error qua beforeUpload Promise, Dropzone thường/disabled/maxCount.
// Mission overlay-api: per-file callbacks (onItemDone/onItemError), retry từng file lỗi,
// progressVariant ring, reason lỗi hiển thị trong list.
import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Upload, UploadDropzone } from './index.js';

/** File upload — button and dropzone variants with per-file status (done/error). */
const meta = {
  title: 'Forms/Upload',
  component: Upload,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Hidden input + trigger + danh sách file (tên + size + × remove). beforeUpload: false → chặn; Promise → uploading (Progress) → done/error. UploadDropzone: kéo-thả + click + keyboard (Enter/Space), dragEnter highlight. Per-file API: onItemDone/onItemError bắn khi từng file xong/lỗi (kèm reason), progressVariant="ring" đổi Progress bar → SVG ring, dòng lỗi có nút retry.',
      },
    },
  },
} satisfies Meta<typeof Upload>;
export default meta;

type Story = StoryObj<typeof meta>;

export const UploadCoBan: Story = {
  name: 'Basic upload',
  render: () => <Upload multiple accept=".pdf,.png,.jpg,.docx" />,
};

export const UploadFileStatus: Story = {
  name: 'File status — done / error',
  render: () => (
    <Upload
      multiple
      // file thường → uploading (Progress chạy) → done sau 1.2s; .exe → reject → error
      beforeUpload={(file) =>
        file.name.endsWith('.exe')
          ? Promise.reject(new Error('Đuôi .exe bị chặn'))
          : new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1200))
      }
    />
  ),
};

export const DropzoneCoBan: Story = {
  name: 'Dropzone — basic',
  render: () => <UploadDropzone multiple />,
};

export const DropzoneDisabled: Story = {
  name: 'Dropzone — disabled',
  render: () => <UploadDropzone disabled />,
};

export const DropzoneMaxCount: Story = {
  name: 'Dropzone — maxCount 3',
  render: () => <UploadDropzone multiple maxCount={3} />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="grid gap-4 rounded-xl bg-canvas p-4">
      <Upload multiple accept=".pdf,.png,.jpg,.docx" />
      <UploadDropzone multiple />
    </div>
  ),
};

/** Per-file callbacks + progress ring + retry — file >1.5MB fail "mạng" lần đầu, Retry lần 2 xong. */
function PerFileDemo() {
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const attempts = useRef(new Map<string, number>());
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex gap-3 text-meta">
        <span className="text-st-done">Hoàn tất: {done}</span>
        <span className="text-st-fail">Lỗi: {failed}</span>
      </div>
      <Upload
        multiple
        progressVariant="ring"
        onItemDone={() => setDone((n) => n + 1)}
        onItemError={(_item, reason) => setFailed((n) => n + 1)}
        beforeUpload={(file) => {
          const attempt = (attempts.current.get(file.name) ?? 0) + 1;
          attempts.current.set(file.name, attempt);
          if (file.name.endsWith('.exe')) return Promise.reject(new Error('Đuôi .exe bị chặn'));
          if (file.size > 1.5 * 1024 * 1024 && attempt === 1) {
            return Promise.reject(new Error('Mạng chậm — bấm Thử lại'));
          }
          return new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 800));
        }}
      />
      <p className="text-meta text-ink3">
        progressVariant="ring" — chọn file &gt;1.5MB để thấy lỗi kèm reason + nút Thử lại (lần 2 thành công).
      </p>
    </div>
  );
}

export const PerFileCallbacks: Story = {
  name: 'Per-file callbacks — onItemDone/onItemError + ring + retry',
  render: () => <PerFileDemo />,
};
