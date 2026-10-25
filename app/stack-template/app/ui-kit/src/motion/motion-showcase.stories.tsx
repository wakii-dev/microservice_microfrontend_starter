// Motion Showcase — quay toàn bộ animation của ui-kit 1 chỗ (motion identity).
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/button/index';
import { Modal } from '../ui/modal/index';
import { Drawer } from '../ui/drawer/index';
import { notification } from '../ui/notification/index';
import { message } from '../ui/message/index';
import { Spinner as SpinnerComp } from '../ui/spinner/index';
import { Switch } from '../ui/switch/index';
import { AvatarGroup } from '../ui/avatar-group/index';
import { Icon } from '../ui/icons/index.js';
import { Badge } from '../ui/badge/index';
import { Progress } from '../ui/progress/index';
import { Result } from '../ui/result/index';
import { Tag } from '../ui/tag/index';

const meta = { title: 'Theming & Motion/Motion Showcase', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function OverlayDemo() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => setModal(true)}>Modal zoom</Button>
      <Button onClick={() => setDrawer(true)}>Drawer slide</Button>
      <Button onClick={() => notification.info('Slide-in phải →')}>Notification</Button>
      <Button onClick={() => message.success('Toast fade-up')}>Message</Button>
      <Modal open={modal} title="Zoom + fade" onCancel={() => setModal(false)} onOk={() => setModal(false)}>
        Đóng = zoom-out + fade (exit nhanh hơn enter 30%).
      </Modal>
      <Drawer open={drawer} title="Slide drawer" onClose={() => setDrawer(false)}>
        Đóng = slide-out phải (exit animation).
      </Drawer>
    </div>
  );
}

function SpinnerMatrix() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {(['ring', 'dots', 'bars'] as const).map((v) => (
        <div key={v} style={{ textAlign: 'center' }}>
          <SpinnerComp label={`spinner-${v}`} variant={v} />
          <div style={{ fontSize: 12, marginTop: 4 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ToggleDemo() {
  const [on, setOn] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Switch checked={on} onChange={setOn} checkedChildren="Bật" unCheckedChildren="Tắt" />
      <span style={{ fontSize: 12 }}>Spring toggle</span>
    </div>
  );
}

export const NenTang: Story = {
  name: 'Overlay + Feedback',
  render: () => <OverlayDemo />,
};
export const SpinnerVariants: Story = { name: 'Spinner variants', render: () => <SpinnerMatrix /> };
export const Toggle: Story = { render: () => <ToggleDemo /> };


// ── Motion Waves (motion-max 2026-10-18) — 12 keyframe mới: bp-float/pulse-soft/
// shake/bounce-in/slide-in-left/right/glow/ripple/marquee/check-draw/indeterminate/
// flip/odometer. Infinite CHỈ cho trạng thái (pulse/float/indeterminate/marquee);
// còn lại 150–500ms one-shot. reduced-motion: block global + motion-reduce:animate-none
// ở chỗ infinite kết thúc ngoài màn hình (indeterminate). ──

/** Replay helper — tăng key để remount node, animation chạy lại. */
function Replay({ label, children }: { label: string; children: (key: number) => ReactNode }) {
  const [key, setKey] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
      <div className="grid h-16 place-items-center">{children(key)}</div>
      <Button size="small" onClick={() => setKey((k) => k + 1)}>
        {label}
      </Button>
    </div>
  );
}

/** 12 keyframe mới — mỗi ô 1 hiệu ứng, nút Replay chạy lại one-shot. */
export const MotionWaves: Story = {
  name: 'Motion Waves — 12 keyframe mới (motion-max)',
  render: () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Replay label="shake">
        {(k) => (
          <span key={k} className="text-2xl font-semibold text-st-fail animate-[bp-shake_400ms_var(--ease-toggle)]">
            Lỗi form
          </span>
        )}
      </Replay>
      <Replay label="bounce-in">
        {(k) => (
          <Tag key={k} className="animate-[bp-bounce-in_var(--motion-base)_var(--ease-enter)]">
            bounce-in
          </Tag>
        )}
      </Replay>
      <Replay label="slide-in-left">
        {(k) => (
          <span key={k} className="text-body text-ink animate-[bp-slide-in-left_var(--motion-base)_var(--ease-enter)]">
            ← từ trái
          </span>
        )}
      </Replay>
      <Replay label="slide-in-right">
        {(k) => (
          <span key={k} className="text-body text-ink animate-[bp-slide-in-right_var(--motion-base)_var(--ease-enter)]">
            từ phải →
          </span>
        )}
      </Replay>
      <Replay label="flip">
        {(k) => (
          <span
            key={k}
            className="grid size-12 place-items-center rounded-xl border border-line bg-s2 animate-[bp-flip_360ms_var(--ease-enter)]"
          >
            <Icon name="star" size={18} className="text-accent" />
          </span>
        )}
      </Replay>
      <Replay label="odometer">
        {(k) => (
          <span key={k} className="inline-block overflow-hidden text-2xl font-semibold tabular-nums text-ink">
            <span className="inline-block animate-[bp-odometer_300ms_var(--ease-enter)]">42</span>
          </span>
        )}
      </Replay>
      <Replay label="check-draw">
        {(k) => (
          <svg key={k} viewBox="0 0 52 52" className="size-12 text-st-done" aria-hidden="true">
            <circle cx="26" cy="26" r="23" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45" pathLength={1} strokeDasharray={1} style={{ animation: 'bp-check-draw 320ms var(--ease-enter) both' }} />
            <path d="M16 27l7.5 7.5L37 20" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} style={{ animation: 'bp-check-draw 420ms 200ms var(--ease-enter) both' }} />
          </svg>
        )}
      </Replay>
      {/* infinite — trạng thái */}
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
        <div className="grid h-16 place-items-center">
          <span aria-hidden="true" className="text-3xl animate-[bp-float_3s_ease-in-out_infinite]">
            🎈
          </span>
        </div>
        <span className="text-meta text-ink3">float 3s ∞ (empty-state icon)</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
        <div className="grid h-16 place-items-center">
          <Badge variant="failed">đang sự cố</Badge>
        </div>
        <span className="text-meta text-ink3">pulse-soft 2s ∞ (failed dot)</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
        <div className="grid h-16 w-full place-items-center">
          <span className="grid size-12 animate-[bp-glow_2.2s_ease-in-out_infinite] place-items-center rounded-xl bg-accent text-white">
            <Icon name="bell" size={18} />
          </span>
        </div>
        <span className="text-meta text-ink3">glow 2.2s ∞ (accent thở)</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
        <div className="grid h-16 w-full place-items-center">
          <div className="w-full">
            <Progress indeterminate />
          </div>
        </div>
        <span className="text-meta text-ink3">indeterminate 1.4s ∞ (loading)</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-s1 p-4">
        <div className="grid h-16 w-full place-items-center overflow-hidden">
          <Button type="primary">Ripple — click thử</Button>
        </div>
        <span className="text-meta text-ink3">ripple 500ms (click)</span>
      </div>
    </div>
  ),
};

/** Marquee — logo strip chạy vô hạn (dải nhân đôi translateX -50%); reduced-motion → dừng. */
export const Marquee: Story = {
  name: 'Marquee — logo strip ∞',
  render: () => {
    const logos = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne'];
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-s1 py-4">
        <div className="flex w-max animate-[bp-marquee_18s_linear_infinite] gap-10 motion-reduce:animate-none">
          {[...logos, ...logos].map((logo, i) => (
            <span key={`${logo}-${i}`} className="flex items-center gap-2 text-body font-semibold text-ink3">
              <Icon name="heart" size={12} />
              {logo}
            </span>
          ))}
        </div>
      </div>
    );
  },
};

/** StatusMotion — hiệu ứng gắn TRẠNG THÁI thật: Result check-draw, Progress
 * indeterminate, Badge failed pulse, AvatarGroup pop-in stagger. */
export const StatusMotion: Story = {
  name: 'Status motion — check-draw · indeterminate · pulse · pop-in',
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
      <Result status="success" title="Đã gate" subTitle="Check-draw stroke vẽ tay khi success" />
      <div className="flex flex-col justify-center gap-4 rounded-xl border border-line bg-s1 p-4">
        <Progress indeterminate />
        <span className="text-meta text-ink3">Progress không biết % — bar chạy vô hạn</span>
        <Badge variant="failed">sự cố — DDL quá hạn</Badge>
        <AvatarGroup
          items={[
            { name: 'Alice Nguyen' },
            { name: 'Binh Vu' },
            { name: 'Chi Tran' },
            { name: 'Duong Pham' },
          ]}
        />
        <span className="text-meta text-ink3">AvatarGroup pop-in stagger 60ms/vị trí</span>
      </div>
    </div>
  ),
};
