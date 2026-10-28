// Editor tests — jsdom + Tiptap v3 thật: .ProseMirror tồn tại, typing → onChange
// HTML, toolbar toggleBold → active state, placeholder lúc trống, undo, imperative
// editor qua editorRef. Type qua editorRef (PM handleBeforeInput trong jsdom
// không đáng tin — commands là API chính thức).
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { Editor } from './index.js';

afterEach(cleanup);

const pm = () => {
  const el = document.querySelector('.ProseMirror');
  if (!el) throw new Error('.ProseMirror chưa mount');
  return el as HTMLElement;
};

// Flaky root cause: Tiptap EditorView mount qua dynamic import (EDITOR_INNER_ENTRY
// lazy) — dưới tải nặng (vitest nhiều worker) 1s mặc định của waitFor không đủ →
// test pass khi chạy lại. Tăng timeout riêng cho mount (bắt từ R2 flaky-hunt
// 2026-10-29: 1/6 run fail đúng test này, 5/6 pass).
const waitForMounted = () => waitFor(() => expect(document.querySelector('.ProseMirror')).toBeInTheDocument(), { timeout: 5000 });

describe('Editor — render', () => {
  it('render → .ProseMirror tồn tại + contentEditable + content khởi tạo', async () => {
    render(<Editor content="<p>Xin chào</p>" />);
    await waitForMounted();
    expect(pm()).toHaveAttribute('contenteditable', 'true');
    expect(pm()).toHaveTextContent('Xin chào');
  });

  it('trống + placeholder → bubble placeholder hiện', async () => {
    render(<Editor placeholder="Viết gì đó…" />);
    await waitForMounted();
    expect(screen.getByText('Viết gì đó…')).toBeInTheDocument();
  });
});

describe('Editor — onChange + commands', () => {
  it('insertContent (commands API) → onChange nhận HTML chứa text', async () => {
    // jsdom: userEvent.type vào ProseMirror không cập nhật PM state (thiếu
    // elementFromPoint) — giả lập qua editor instance như spec cho phép
    const onChange = vi.fn();
    let editor: TiptapEditor | null = null;
    render(<Editor onChange={onChange} editorRef={(ed) => (editor = ed as TiptapEditor)} />);
    await waitForMounted();
    editor!.commands.insertContent('abc');
    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    expect(String(onChange.mock.calls.at(-1)?.[0])).toContain('abc');
  });

  it('toolbar toggleBold sau selectAll → onChange wrap <strong>', async () => {
    const onChange = vi.fn();
    let editor: TiptapEditor | null = null;
    render(<Editor content="<p>hello</p>" onChange={onChange} editorRef={(ed) => (editor = ed as TiptapEditor)} />);
    await waitForMounted();
    editor!.commands.selectAll();
    const boldBtn = screen.getByRole('button', { name: 'Đậm' });
    expect(boldBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(boldBtn);
    expect(editor!.isActive('bold')).toBe(true);
    expect(boldBtn).toHaveAttribute('aria-pressed', 'true');
    expect(boldBtn).toHaveClass('bg-s3');
    expect(editor!.getHTML()).toContain('<strong>hello</strong>');
    expect(onChange).toHaveBeenCalled();
  });

  it('toggleHeading H2 → isActive heading level 2', async () => {
    let editor: TiptapEditor | null = null;
    render(<Editor content="<p>tiêu đề</p>" editorRef={(ed) => (editor = ed as TiptapEditor)} />);
    await waitForMounted();
    fireEvent.click(screen.getByRole('button', { name: 'Tiêu đề 2' }));
    expect(editor!.isActive('heading', { level: 2 })).toBe(true);
    expect(editor!.getHTML()).toContain('<h2>');
  });

  it('undo → trả về nội dung trước đó', async () => {
    let editor: TiptapEditor | null = null;
    render(<Editor content="<p>gốc</p>" editorRef={(ed) => (editor = ed as TiptapEditor)} />);
    await waitForMounted();
    fireEvent.click(screen.getByRole('button', { name: 'Tiêu đề 2' }));
    expect(editor!.getHTML()).toContain('<h2>');
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
    expect(editor!.getHTML()).not.toContain('<h2>');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Editor — classNames + style', () => {
  it('slots lên đúng element: root/toolbar/content; className sau root slot', async () => {
    render(
      <Editor
        content="<p>slots</p>"
        classNames={{ root: 'slot-root', toolbar: 'slot-toolbar', content: 'slot-content' }}
        className="user-last"
      />,
    );
    await waitForMounted();
    const root = pm().closest('.slot-root')!;
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    expect(root.querySelector('.slot-toolbar')).toBeInTheDocument();
    expect(pm().closest('.slot-content')).toBeInTheDocument();
  });

  it('style passthrough lên root (editor vẫn gõ được)', async () => {
    let editor: TiptapEditor | null = null;
    render(
      <Editor
        content="<p>x</p>"
        style={{ margin: '8px' }}
        className="marker-root"
        editorRef={(ed) => (editor = ed as TiptapEditor)}
      />,
    );
    await waitForMounted();
    const root = pm().closest('.marker-root') as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    editor!.commands.insertContent('more');
    expect(editor!.getHTML()).toContain('more');
  });
});
