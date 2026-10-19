// HERO — ORCA × WAKII Cinematic Experience (owner @v2, contract v0.2 + tích hợp 3D W8).
// Nền 3D THẬT: Scene3D (starfield 800 hạt 3D + fog + lighting — của @w8) + ShipModel
// auto-rotate trung tâm. Fallback khi thiếu peer-dep `three`/WebGL: gradient vũ trụ
// tĩnh + sao CSS. Bố cục REF-SPEC: brand trái trên · trailer phải trên (white box
// chữ tối) · CLICK ◆ ENTER giữa · cụm chữ editorial trái · email signup + mini-nav
// trái dưới · thumbnail phải dưới. reduced-motion: 3D đứng frame tĩnh (Scene3D lo).
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Icon, Input, Modal, useMediaQuery } from '../../../index';
import { Scene3D, ShipModel } from '../../../ui/experience3d/index.js';

/** Fallback khi thiếu `three`/WebGL — gradient vũ trụ tĩnh + sao CSS lặp. */
function StaticUniverse() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(to bottom, #0b0e1a, var(--scrim-4))',
        backgroundImage:
          'radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 75px 85px, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 110px 40px, rgba(255,255,255,0.8), transparent)',
        backgroundSize: '140px 140px',
      }}
    />
  );
}

export default function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [trailer, setTrailer] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <header
      id="hero"
      data-mood="atlas"
      className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-canvas p-6 text-center"
    >
      {/* Nền 3D — Scene3D (W8): starfield 800 hạt + fog + lighting; fallback tĩnh nếu thiếu three */}
      <div className="absolute inset-0">
        <Scene3D className="size-full" height="100%" fallback={<StaticUniverse />} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Top bar — brand trái · trailer phải (white box chữ tối, REF-SPEC CTA) */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-10 py-7">
        <span className="font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-md">
          ORCA × WAKII
        </span>
        <Button onClick={() => setTrailer(true)} className="bg-white shadow-lift">
          <span className="text-[12px] font-bold uppercase tracking-[2.4px] text-[rgb(35,31,32)]">
            Watch the trailer
          </span>
          <Icon name="angle-double-right" size={13} className="text-[#ff5c39]" />
        </Button>
      </div>

      {/* Ship model + CLICK ◆ ENTER — trung tâm (auto-rotate; reduced = frame tĩnh) */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <ShipModel height={320} autoRotate={!reduced} fallback={<StaticUniverse />} />
        <span className="text-[11px] font-bold uppercase tracking-[3.2px] text-white/80 drop-shadow-md">
          click <span aria-hidden="true">◆</span> enter
        </span>
      </div>

      {/* Cụm chữ editorial TRÁI — 17px thường (KHÔNG caps to), ref bố cục */}
      <div className="absolute left-10 top-[44%] z-10 max-w-[250px] text-left max-md:left-6 max-md:top-[36%]">
        <p className="m-0 text-[17px] leading-[1.5] text-white drop-shadow-md">
          A task platform for engineering teams — sprint, saga and evidence in one scroll.
        </p>
      </div>

      {/* Đăng ký + mini-nav trái dưới (ref: sign up + nav links) */}
      <div className="absolute bottom-16 left-10 z-10 w-[300px] text-left max-md:bottom-8 max-md:left-6">
        <p className="m-0 mb-2 text-[15px] font-bold text-white drop-shadow-sm">Đăng ký nhận digest</p>
        <div className="flex items-center gap-1 rounded-lg border border-white/25 bg-black/40 p-1 backdrop-blur-sm">
          <Input
            aria-label="Email đăng ký"
            placeholder="email@company.vn"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="border-0 bg-transparent"
          />
          <button
            type="button"
            aria-label="Gửi"
            onClick={() => setSubscribed(true)}
            className="cursor-pointer rounded-md border-none bg-transparent p-2 text-[#ff5c39] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
        {subscribed && (
          <p role="status" className="m-0 mt-2 text-meta text-white/90">
            Đã ghi nhận — digest gửi mỗi thứ Hai.
          </p>
        )}
        <nav aria-label="Chương (hero)" className="mt-7 grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            ['#ch1', '01 Deep focus'],
            ['#ch2', '02 Living docs'],
            ['#ch3', '03 Velocity'],
            ['#ch4', '04 Ship'],
            ['#ch5', '05 Future'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.8px] text-white/85 no-underline opacity-90 transition-opacity hover:opacity-100"
            >
              <span aria-hidden="true" className="text-[#ff5c39]">◆</span>
              {label}
            </a>
          ))}
        </nav>
        <p className="m-0 mt-5 text-[10px] font-bold uppercase tracking-[2.4px] text-white/70">
          Terms of service
        </p>
      </div>

      {/* Thumbnail trailer phải dưới */}
      <button
        type="button"
        onClick={() => setTrailer(true)}
        aria-label="Xem trailer"
        className="absolute bottom-16 right-10 z-10 hidden cursor-pointer overflow-hidden rounded-md border border-white/70 shadow-lift lg:block"
      >
        <img
          src="https://picsum.photos/seed/wakii-trailer-cover/420/240"
          alt=""
          className="block h-[120px] w-[210px] object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 bg-[var(--scrim-3)] px-2 py-1 text-left text-[10px] font-bold uppercase tracking-[1.8px] text-white">
          Season patch — trailer
        </span>
      </button>

      <Modal
        open={trailer}
        title="Trailer — ORCA × WAKII"
        onCancel={() => setTrailer(false)}
        okText="Đóng"
        cancelText="Huỷ"
        onOk={() => setTrailer(false)}
      >
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <img
              key={n}
              src={`https://picsum.photos/seed/wakii-trailer-${n}/480/300`}
              alt={`Trailer frame ${n}`}
              className="w-full rounded-lg border border-line object-cover"
            />
          ))}
        </div>
        <p className="mb-0 mt-3 text-meta text-ink3">
          Demo frames (0-deps — không nhúng video). Trong app thật: chart sống + timeline sự kiện.
        </p>
      </Modal>
    </header>
  );
}
