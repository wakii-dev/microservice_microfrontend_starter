// auto-flip — đo panel so với viewport, lật placement khi panel sát mép (mission overlay-api).
// Dùng chung Popover ↔ Tooltip: panel render đúng placement yêu cầu → useLayoutEffect đo
// getBoundingClientRect TRƯỚC KHI paint → tràn mép theo trục của placement thì lật đúng
// 1 lần (top↔bottom theo trục dọc, left↔right theo trục ngang). Đóng/mở lại hoặc đổi
// placement → đo lại từ placement yêu cầu. jsdom (rect 0) → không bao giờ lật — test
// mock getBoundingClientRect khi cần.
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export type FlipPlacement = 'top' | 'bottom' | 'left' | 'right';

const FLIPPED: Record<FlipPlacement, FlipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Placement thực tế để render panel: trả về `placement` yêu cầu, trừ khi panel đo được
 * tràn viewport theo trục tương ứng (top/bottom tràn trên/dưới → lật; left/right tràn
 * trái/phải → lật). Chỉ lật 1 lần mỗi lần mở (placement lật không đo lại — trigger ở
 * giữa 2 mép thì chấp nhận phía lật, giống antd).
 */
export function useAutoFlipPlacement<T extends HTMLElement>(
  open: boolean,
  placement: FlipPlacement,
  panelRef: RefObject<T | null>,
): FlipPlacement {
  const [effective, setEffective] = useState<FlipPlacement>(placement);

  // Đóng (hoặc đổi placement yêu cầu) → quay về placement yêu cầu, lần mở sau đo lại
  useEffect(() => {
    if (!open) setEffective(placement);
  }, [open, placement]);

  // Panel đã gắn với đúng placement yêu cầu → đo 1 lần trước paint, lật nếu tràn mép
  useLayoutEffect(() => {
    if (!open || effective !== placement) return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const overflow =
      (placement === 'top' && rect.top < 0) ||
      (placement === 'bottom' && rect.bottom > window.innerHeight) ||
      (placement === 'left' && rect.left < 0) ||
      (placement === 'right' && rect.right > window.innerWidth);
    if (overflow) setEffective(FLIPPED[placement]);
  }, [open, placement, effective, panelRef]);

  return effective;
}
