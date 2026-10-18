// UploadPage — demo Upload (trigger + list trạng thái) + UploadDropzone (kéo thả,
// maxCount) (batch ⑦). List trạng thái done/uploading/error là nội bộ Upload.
import { Alert, Card, Upload, UploadDropzone } from '@wakii-dev/ui-kit';

export function UploadPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Upload files</h1>
        <p className="mt-1 mb-0 text-body text-ink3">
          Tải lên avatar, tài liệu — list trạng thái (đang tải / xong / lỗi) tự quản nội bộ.
        </p>
      </div>

      <Alert
        type="info"
        message="File < 10MB — định dạng ảnh hoặc PDF"
        description="beforeUpload có thể chặn file (trả false) hoặc validate async (Promise → đang tải → xong/lỗi)."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Upload cơ bản (nhiều file)">
          <Upload multiple accept="image/*,.pdf,.docx" />
        </Card>
        <Card title="Dropzone — kéo thả (tối đa 5 file)">
          <UploadDropzone multiple maxCount={5} />
          <p className="mb-0 mt-3 text-meta text-ink3">
            Kéo thả hoặc click để chọn — dragEnter highlight, Enter/Space mở dialog.
          </p>
        </Card>
      </div>
    </div>
  );
}
