// Tests Upload + UploadDropzone — behavior theo spec batch ③ worker B:
// input change → onChange + list; dragEnter highlight; drop DataTransfer mock; beforeUpload false;
// multiple/maxCount chặn thừa; remove gọi onRemove; disabled không mở dialog; keyboard Enter/Space.
// Mission overlay-api: per-file callbacks (onItemDone/onItemError + reason), retry per file,
// progressVariant ring (bar fallback).
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

  it('onItemDone bắn khi MỖI file xong — Promise resolve (status done, progress 100)', async () => {
    const onItemDone = vi.fn();
    const { container } = render(
      <Upload multiple beforeUpload={() => Promise.resolve(true)} onItemDone={onItemDone} />,
    );

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('a.pdf'), makeFile('b.pdf')] } });
    await act(async () => {});

    expect(onItemDone).toHaveBeenCalledTimes(2);
    expect(onItemDone.mock.calls[0][0]).toMatchObject({ status: 'done', progress: 100 });
    expect(onItemDone.mock.calls[0][0].file.name).toBe('a.pdf');
    expect(onItemDone.mock.calls[1][0].file.name).toBe('b.pdf');
  });

  it('onItemDone bắn cả khi add đồng bộ (không beforeUpload) — status done ngay', () => {
    const onItemDone = vi.fn();
    const { container } = render(<Upload onItemDone={onItemDone} />);

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('sync.txt')] } });

    expect(onItemDone).toHaveBeenCalledTimes(1);
    expect(onItemDone.mock.calls[0][0]).toMatchObject({ status: 'done' });
    expect(onItemDone.mock.calls[0][0].file.name).toBe('sync.txt');
  });

  it('onItemError bắn khi MỖI file lỗi — reason là message của reject + list hiện reason', async () => {
    const onItemError = vi.fn();
    const { container } = render(
      <Upload
        beforeUpload={(file) =>
          file.name.endsWith('.exe') ? Promise.reject(new Error('Đuôi .exe bị chặn')) : Promise.resolve(true)
        }
        onItemError={onItemError}
      />,
    );

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('virus.exe')] } });
    await act(async () => {});

    expect(onItemError).toHaveBeenCalledTimes(1);
    const [item, reason] = onItemError.mock.calls[0];
    expect(item).toMatchObject({ status: 'error', error: 'Đuôi .exe bị chặn' });
    expect(item.file.name).toBe('virus.exe');
    expect(reason).toBe('Đuôi .exe bị chặn');
    expect(screen.getByText('Lỗi')).toBeInTheDocument(); // nhãn giữ nguyên
    expect(screen.getByText('Đuôi .exe bị chặn')).toBeInTheDocument(); // + reason
  });

  it('nút Thử lại chạy lại beforeUpload cho đúng dòng lỗi — lần 2 thành công → done', async () => {
    let attempt = 0;
    const { container } = render(
      <Upload beforeUpload={() => (++attempt === 1 ? Promise.reject(new Error('Mạng chậm')) : Promise.resolve(true))} />,
    );

    fireEvent.change(getFileInput(container), { target: { files: [makeFile('cv.pdf')] } });
    await act(async () => {});
    expect(screen.getByText('Lỗi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại cv.pdf' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0'); // reset progress
    await act(async () => {});

    expect(screen.queryByText('Lỗi')).toBeNull(); // done
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
  });

  it('progressVariant="ring" → SVG progressbar thay bar khi uploading; mặc định vẫn bar', () => {
    const pending = () => new Promise<boolean>(() => {}); // treo vĩnh viễn — giữ trạng thái uploading
    const { container: ringRoot } = render(<Upload progressVariant="ring" beforeUpload={pending} />);
    fireEvent.change(getFileInput(ringRoot), { target: { files: [makeFile('a.pdf')] } });

    const ring = screen.getByRole('progressbar');
    expect(ring.tagName).toBe('svg');
    expect(ring).toHaveAttribute('aria-valuemax', '100');

    cleanup();
    const { container: barRoot } = render(<Upload beforeUpload={pending} />);
    fireEvent.change(getFileInput(barRoot), { target: { files: [makeFile('b.pdf')] } });

    expect(screen.getByRole('progressbar').tagName).toBe('DIV'); // bar fallback
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

describe('Upload — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root / list / listItem / listRemove (Upload) + dropzone (UploadDropzone)', () => {
    const slots = { root: 'slot-root', dropzone: 'slot-dropzone', list: 'slot-list', listItem: 'slot-item', listRemove: 'slot-remove' };
    const { container: c1 } = render(<Upload classNames={slots} />);
    fireEvent.change(getFileInput(c1), { target: { files: [makeFile('a.pdf')] } });
    expect(c1.querySelector('.slot-root')).not.toBeNull();
    expect(c1.querySelector('ul')).toHaveClass('slot-list');
    expect(screen.getByText('a.pdf').closest('li')).toHaveClass('slot-item');
    expect(screen.getByLabelText('Xoá a.pdf')).toHaveClass('slot-remove');
    cleanup();

    const { container: c2 } = render(<UploadDropzone classNames={slots} />);
    const zone = screen.getByRole('button', { name: ZONE_NAME });
    expect(zone).toHaveClass('slot-dropzone');
    expect(zone.parentElement).toHaveClass('slot-root');
  });

  it('style passthrough lên root + không truyền slots → chọn file vẫn onChange (behavior giữ nguyên)', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload onChange={onChange} style={{ margin: '8px' }} className="user-last" />);
    const rootEl = getFileInput(container).parentElement as HTMLElement;
    expect(rootEl).toHaveStyle({ margin: '8px' });
    expect(rootEl.className.indexOf('user-last')).toBeGreaterThanOrEqual(0);
    fireEvent.change(getFileInput(container), { target: { files: [makeFile('b.pdf')] } });
    expect(onChange).toHaveBeenCalledWith([expect.any(File)]);
  });
});
