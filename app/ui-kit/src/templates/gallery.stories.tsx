// Templates/Immersive Gallery — trang xem ảnh cinematic ghép từ kit:
// hero Parallax 3 tốc độ (0.08/280 nền · 0.3/240 caption-card · 0.5/280 chữ) ·
// spotlight viewer (UiImage + mũi tên Icon prev/next + Progress bar xem + caption
// Fade key-replay) · lightbox Modal (zoom built-in) · Galleria swipe strip ·
// duotone wall 3 cột Parallax 3 tốc độ với graded tint tokens.
// 100% ui-kit · tokens-only (duotone = saturate-0 + mix-blend tint token) ·
// dark cascade. Ảnh picsum seeded — demo-only, site thay asset thật.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/button/index';
import { Divider } from '../ui/divider/index';
import { Fade } from '../ui/transition/index';
import { Galleria, type GalleriaImage } from '../ui/galleria/index';
import { Icon } from '../ui/icons/index.js';
import { Modal } from '../ui/modal/index';
import { Parallax } from '../ui/parallax/index';
import { Progress } from '../ui/progress/index';
import { Tag } from '../ui/tag/index';
import { UiImage } from '../ui/image/index';
import { Title, Text } from '../ui/typography/index';

const meta = { title: 'Templates/Immersive Gallery', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const SHOTS: Array<{ src: string; alt: string; caption: string; place: string }> = [
  { src: photo('gal-canyon', 1200, 800), alt: 'Hẻm núi đá đỏ lúc hoàng hôn', caption: 'Hẻm núi — ánh cuối ngày quét qua vách đá', place: 'Canyon · 18:42' },
  { src: photo('gal-fjord', 1200, 800), alt: 'Vịnh nước xanh lục giữa hai dãy núi tuyết', caption: 'Vịnh fjord — nước lặng như gương', place: 'Fjord · 07:15' },
  { src: photo('gal-dune', 1200, 800), alt: 'Đụn cát có vết gió khắc', caption: 'Sa mạc — gió vẽ lại đồi mỗi đêm', place: 'Dune · 12:03' },
  { src: photo('gal-forest', 1200, 800), alt: 'Rừng thông trong sương sớm', caption: 'Rừng — sương chưa tan khỏi tán thông', place: 'Forest · 06:20' },
  { src: photo('gal-ridge', 1200, 800), alt: 'Sườn núi đá phủ tuyết dưới trời xanh thẫm', caption: 'Sườn ridge — chặng cao nhất của cung trek', place: 'Ridge · 15:48' },
];

const TINTS = ['bg-accent/25', 'bg-st-done/20', 'bg-st-doing/20', 'bg-st-fail/15', 'bg-accent/15'] as const;

/** Hero — Parallax 3 tốc độ: nền trôi chậm nhất, caption-card chậm, chữ dẫn đầu. */
function Hero() {
  return (
    <section aria-label="Gallery hero" className="relative h-[130vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <Parallax speed={0.08} strength={280} className="absolute inset-0">
          <img
            src={photo('gal-hero', 1600, 1000)}
            alt=""
            aria-hidden="true"
            className="size-full scale-125 object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
        </Parallax>
        <Parallax speed={0.3} strength={240} className="absolute right-8 top-1/4 hidden rounded-xl border border-white/20 bg-[var(--scrim-3)] px-5 py-3 backdrop-blur-sm md:block">
          <span className="text-[11px] font-bold uppercase tracking-[2.64px] text-white/80">Immersive Gallery</span>
        </Parallax>
        <Parallax speed={0.5} strength={280} className="relative z-10 max-w-2xl px-6 text-center mx-auto">
          <Tag icon={<Icon name="star" size={12} />}>photo essay — 5 cảnh</Tag>
          <Title level={1} style={{ marginBottom: 0, fontSize: 18, fontWeight: 300, color: 'var(--ink)' }} className="mt-4 drop-shadow-md">
            Năm khung hình, một hành trình
          </Title>
          <Text className="mt-2 block text-white/85" type="secondary">
            Cuộn để đi qua từng cảnh — ảnh trôi theo ba nhịp sâu khác nhau.
          </Text>
        </Parallax>
      </div>
    </section>
  );
}

/** Spotlight — ảnh lớn + mũi tên Icon prev/next + Progress bar xem + caption Fade. */
function Spotlight({ onZoom }: { onZoom: (index: number) => void }) {
  const [index, setIndex] = useState(0);
  const shot = SHOTS[index];
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + SHOTS.length) % SHOTS.length);

  return (
    <section aria-label="Xem ảnh từng khung" className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <Title level={2} style={{ marginBottom: 0, fontSize: 29, fontWeight: 300 }} className="tracking-[0.02em]">
          Từng khung, phóng to
        </Title>
        <Button
          icon={<Icon name="external-link" size={14} />}
          onClick={() => onZoom(index)}
        >
          Lightbox
        </Button>
      </div>

      {/* Ảnh lớn — UiImage click mở preview overlay (lightbox built-in của kit) */}
      <Fade in key={index} className="rounded-xl">
        <UiImage src={shot.src} alt={shot.alt} className="aspect-[3/2] w-full object-cover" />
      </Fade>

      <div className="flex items-center gap-4">
        <Button
          aria-label="Ảnh trước"
          icon={<Icon name="arrow-left" size={14} />}
          onClick={() => go(-1)}
        >
          <span className="sr-only">Ảnh trước</span>
        </Button>
        {/* Progress bar xem — % khung đang mở trên tổng bộ */}
        <div className="flex-1">
          <Progress percent={((index + 1) / SHOTS.length) * 100} showInfo={false} />
        </div>
        <span className="w-14 text-right font-mono text-meta text-ink3">
          {String(index + 1).padStart(2, '0')} / {String(SHOTS.length).padStart(2, '0')}
        </span>
        <Button
          aria-label="Ảnh sau"
          onClick={() => go(1)}
        >
          <span className="sr-only">Ảnh sau</span>
          <Icon name="arrow-right" size={14} />
        </Button>
      </div>

      {/* Caption — Fade replay mỗi lần đổi khung */}
      <Fade in key={`cap-${index}`}>
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-ink2">
          <span className="font-mono text-meta text-ink3">{shot.place}</span>
          {shot.caption}
        </p>
      </Fade>
    </section>
  );
}

/** Duotone wall — 3 cột Parallax 3 tốc độ, ảnh graded (grayscale + tint token). */
function DuotoneWall() {
  const speeds = [0.08, 0.3, 0.5];
  return (
    <section aria-label="Bức tường duotone" className="mx-auto flex max-w-4xl flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0, fontSize: 29, fontWeight: 300 }} className="tracking-[0.02em]">
        Ba nhịp sâu, một tông màu
      </Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SHOTS.slice(0, 3).map((shot, i) => (
          <Parallax key={shot.src} speed={speeds[i]} className="overflow-hidden rounded-xl">
            <figure className="relative m-0">
              <img
                src={shot.src}
                alt={shot.alt}
                className="aspect-[3/4] w-full object-cover saturate-0 contrast-125"
              />
              {/* graded duotone — tint token multiply + lift screen (không hex) */}
              <div aria-hidden="true" className={`absolute inset-0 mix-blend-multiply ${TINTS[i]}`} />
              <div aria-hidden="true" className="absolute inset-0 bg-canvas/15 mix-blend-screen" />
              <figcaption className="absolute bottom-2 left-2 rounded-pill bg-[var(--scrim-3)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[2.64px] text-white">
                {shot.place}
              </figcaption>
            </figure>
          </Parallax>
        ))}
      </div>
      <span className="text-meta text-ink3">
        Tốc độ trôi 0.08 / 0.3 / 0.5 — ảnh grade duotone bằng tint token (multiply) + lift (screen).
      </span>
    </section>
  );
}

/** Full page — hero pinned → spotlight → galleria strip → duotone wall. */
function GalleryPage({ onZoom }: { onZoom: (i: number) => void }) {
  const strip: GalleriaImage[] = SHOTS.map((s) => ({ src: s.src, alt: s.alt, caption: s.caption }));
  return (
    <div data-bp-theme="dark" className="bg-canvas text-ink">
      <Hero />
      <div className="mx-auto flex max-w-4xl flex-col gap-14 px-6 py-16">
        <Spotlight onZoom={onZoom} />

        <Divider dashed>bộ sưu tập trượt ngang</Divider>
        <section aria-label="Galleria trượt ngang">
          <Galleria images={strip} className="max-w-3xl" />
        </section>

        <DuotoneWall />
      </div>
    </div>
  );
}

/** Immersive Gallery — trang đầy đủ; nút Lightbox mở Modal (zoom built-in). */
export const ImmersiveGallery: Story = {
  name: 'Immersive Gallery — hero pinned · spotlight · galleria · duotone',
  render: () => <GalleryWithModal />,
};

function GalleryWithModal() {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const shot = zoomIndex === null ? null : SHOTS[zoomIndex];
  return (
    <>
      <GalleryPage onZoom={setZoomIndex} />
      {/* Lightbox Modal — zoom built-in của Modal; ESC/mask/× đóng */}
      <Modal
        open={shot !== null}
        title={shot ? `${shot.place} — ảnh gốc` : ''}
        okText="Đóng"
        cancelText="Thu nhỏ"
        onOk={() => setZoomIndex(null)}
        onCancel={() => setZoomIndex(null)}
      >
        {shot && (
          <Fade in>
            <figure className="m-0 flex flex-col gap-2">
              <img src={shot.src} alt={shot.alt} className="w-full rounded-lg object-cover" />
              <figcaption className="text-meta text-ink3">{shot.caption}</figcaption>
            </figure>
          </Fade>
        )}
      </Modal>
    </>
  );
}

/** Minimal — chỉ spotlight viewer + progress (dựng nhanh cho nhúng trang khác). */
export const SpotlightOnly: Story = {
  name: 'Minimal — spotlight viewer + progress bar',
  render: () => (
    <div data-bp-theme="dark" className="mx-auto max-w-3xl bg-canvas px-6 py-12 text-ink">
      <Spotlight onZoom={() => {}} />
    </div>
  ),
};
