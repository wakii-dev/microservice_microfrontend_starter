// upload.stories.tsx — Primitives/Upload (batch ③ worker B): Upload cơ bản, file status
// done/error qua beforeUpload Promise, Dropzone thường/disabled/maxCount.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Upload, UploadDropzone } from './index.js';

const meta = {
  title: 'Primitives/Upload',
  component: Upload,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Hidden input + trigger + danh sách file (tên + size + × remove). beforeUpload: false → chặn; Promise → uploading (Progress) → done/error. UploadDropzone: kéo-thả + click + keyboard (Enter/Space), dragEnter highlight.',
      },
    },
  },
} satisfies Meta<typeof Upload>;
export default meta;

type Story = StoryObj<typeof meta>;

export const UploadCoBan: Story = {
  name: 'Upload cơ bản',
  render: () => <Upload multiple accept=".pdf,.png,.jpg,.docx" />,
};

export const UploadFileStatus: Story = {
  name: 'Upload file status (done/error)',
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
  name: 'Dropzone cơ bản',
  render: () => <UploadDropzone multiple />,
};

export const DropzoneDisabled: Story = {
  name: 'Dropzone disabled',
  render: () => <UploadDropzone disabled />,
};

export const DropzoneMaxCount: Story = {
  name: 'Dropzone maxCount=3',
  render: () => <UploadDropzone multiple maxCount={3} />,
};
