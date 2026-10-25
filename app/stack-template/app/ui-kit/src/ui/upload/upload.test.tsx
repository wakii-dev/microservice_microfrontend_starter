// Tests Upload + UploadDropzone — behavior theo spec batch ③ worker B:
// input change → onChange + list; dragEnter highlight; drop DataTransfer mock; beforeUpload false;
// multiple/maxCount chặn thừa; remove gọi onRemove; disabled không mở dialog; keyboard Enter/Space.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Upload, UploadDropzone } from './index.js';

function makeFile(name: string, size = 100, type = 'text/plain') {
  return new File(['x'.repeat(size)], name, { type });
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

const ZONE_NAME = 'Kéo thả hoặc click để chọn'; // accessible name của dropzone (role=button)

afterEach(cleanup);

describe('Upload', () => {
  it('chọn file qua input → onChange nhận files + list render tên + size', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload multiple onChange={onChange} />);

    const f1 = makeFile('report.pdf', 2048);
    const f2 = makeFile('photo.png', 512 * 1024);
    fireEvent.change(getFileInput(container), { target: { files: [f1, f2] } });

    expect(onChange).toHaveBeenCalledWith([f1, f2]);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument(); // formatSize KB
    expect(screen.getByText('512.0 KB')).toBeInTheDocument();
  });

  it('beforeUpload trả false → không add + không onChange', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload beforeUpload={() => false} onChange={onChange} />);

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('blocked.exe')] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('blocked.exe')).toBeNull();
  });

  it('beforeUpload async resolve → done (Progress biến mất); reject → error', async () => {
    const { container } = render(
      <Upload
        multiple
        beforeUpload={(file) =>
          file.name.endsWith('.exe')
            ? Promise.reject(new Error('blocked'))
            : Promise.resolve(true)
        }
      />,
    );

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('a.pdf'), makeFile('b.exe')] } });

    // cả 2 đang 'uploading' → mỗi dòng 1 Progress
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.exe')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);

    await act(async () => {}); // flush microtasks — Promise resolve/reject

    expect(screen.getByText('Lỗi')).toBeInTheDocument(); // b.exe reject
    expect(screen.queryByRole('progressbar')).toBeNull(); // a.pdf done
  });

  it('multiple=false → chỉ nhận file đầu', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload onChange={onChange} />);

    const a = makeFile('a.txt');
    const b = makeFile('b.txt');
    fireEvent.change(getFileInput(container), { target: { files: [a, b] } });

    expect(onChange).toHaveBeenCalledWith([a]);
    expect(screen.queryByText('b.txt')).toBeNull();
  });

  it('maxCount=2 với 3 files → chặn file thừa', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload multiple maxCount={2} onChange={onChange} />);

    const a = makeFile('a.txt');
    const b = makeFile('b.txt');
    const c = makeFile('c.txt');
    fireEvent.change(getFileInput(container), { target: { files: [a, b, c] } });

    expect(onChange).toHaveBeenCalledWith([a, b]);
    expect(screen.queryByText('c.txt')).toBeNull();
  });

  it('maxCount chặn cả lần chọn tiếp theo khi đã đầy', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload maxCount={1} onChange={onChange} />);

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('a.txt')] } });
    fireEvent.change(getFileInput(container), { target: { files: [makeFile('b.txt')] } });

    expect(onChange).toHaveBeenCalledTimes(1); // lần 2 bị chặn hoàn toàn
    expect(screen.queryByText('b.txt')).toBeNull();
  });

  it('remove → onRemove(file) + list cập nhật + onChange rỗng', () => {
    const onRemove = vi.fn();
    const onChange = vi.fn();
    const { container } = render(<Upload onRemove={onRemove} onChange={onChange} />);

    const f = makeFile('a.txt', 2048);
    fireEvent.change(getFileInput(container), { target: { files: [f] } });

    fireEvent.click(screen.getByRole('button', { name: 'Xoá a.txt' }));

    expect(onRemove).toHaveBeenCalledWith(f);
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText('a.txt')).toBeNull();
  });

  it('disabled → click trigger không mở dialog', () => {
    const { container } = render(<Upload disabled />);
    const input = getFileInput(container);
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /Chọn tệp/ }));

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('showList=false → ẩn danh sách file', () => {
    const { container } = render(<Upload showList={false} />);

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('hidden.txt')] } });

    expect(screen.queryByText('hidden.txt')).toBeNull();
  });
});

describe('UploadDropzone', () => {
  it('dragEnter → highlight border-accent + bg tint; dragLeave → thường', () => {
    render(<UploadDropzone />);
    const zone = screen.getByRole('button', { name: ZONE_NAME });

    expect(zone.className).not.toContain('border-accent');

    fireEvent.dragEnter(zone);
    expect(zone.className).toContain('border-accent');
    expect(zone.className).toContain('bg-accent/8');

    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain('border-accent');
  });

  it('drop với DataTransfer mock → onChange + list render', () => {
    const onChange = vi.fn();
    render(<UploadDropzone onChange={onChange} />);
    const zone = screen.getByRole('button', { name: ZONE_NAME });

    const file = makeFile('dropped.txt', 100);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith([file]);
    expect(screen.getByText('dropped.txt')).toBeInTheDocument();
  });

  it('drop khi disabled → không add', () => {
    const onChange = vi.fn();
    render(<UploadDropzone disabled onChange={onChange} />);
    const zone = screen.getByRole('button', { name: ZONE_NAME });

    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('x.txt')] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('x.txt')).toBeNull();
  });

  it('click + keyboard Enter/Space mở dialog', () => {
    const { container } = render(<UploadDropzone />);
    const input = getFileInput(container);
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    const zone = screen.getByRole('button', { name: ZONE_NAME });

    fireEvent.click(zone);
    fireEvent.keyDown(zone, { key: 'Enter' });
    fireEvent.keyDown(zone, { key: ' ' });

    expect(clickSpy).toHaveBeenCalledTimes(3);
  });

  it('disabled → aria-disabled + tabIndex -1 + Enter không mở dialog', () => {
    const { container } = render(<UploadDropzone disabled />);
    const input = getFileInput(container);
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    const zone = screen.getByRole('button', { name: ZONE_NAME });

    expect(zone).toHaveAttribute('aria-disabled', 'true');
    expect(zone).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
