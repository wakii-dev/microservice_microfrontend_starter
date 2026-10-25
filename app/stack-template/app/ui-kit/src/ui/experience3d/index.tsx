// experience3d — WebGL cinematic (PO duyệt procedural 3D, 2026-10-18):
// ShipModel (tàu low-poly procedural + drag-rotate 360 có inertia + auto-rotate
// idle) · Scene3D (stage: canvas + lighting 3 điểm + fog + starfield 800 hạt) ·
// ScrollFlythrough (camera bay CatmullRom 4 điểm theo `progress` — dùng độc lập
// hoặc nhúng chương Cinematic). three là PEER-DEP optional — import ĐỘNG, thiếu
// dep hoặc WebGL không khả dụng → `fallback` node (pattern chart). reduced-motion
// → 1 frame tĩnh ĐẸP (không rAF loop, auto-rotate off). Imperative three (không
// R3F): dispose đầy đủ, jsdom graceful, không phụ thuộc JSX-intrinsic typing.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

type Three = typeof import('three');
type Vec3 = InstanceType<Three['Vector3']>;
type SceneT = InstanceType<Three['Scene']>;
type CameraT = InstanceType<Three['PerspectiveCamera']>;
type RendererT = InstanceType<Three['WebGLRenderer']>;
type PointsT = InstanceType<Three['Points']>;
type GroupT = InstanceType<Three['Group']>;

let threePromise: Promise<Three> | null = null;
/** Import động chia sẻ — consumer thiếu peer → reject → fallback (pattern chart). */
function loadThree(): Promise<Three> {
  threePromise ??= import('three');
  return threePromise;
}

/** Stage đã mount — thứ các component nhận từ setup. */
interface Stage {
  scene: SceneT;
  camera: CameraT;
  renderer: RendererT;
  stars: PointsT;
  /** Đổi màu sao theo theme scope (QA: trắng vô hình trên light). */
  setStarColor(cssColor: string): void;
  /** Render 1 frame ngay (chế độ tĩnh). */
  renderOnce(): void;
  /** Bắt rAF loop (chế độ động). tick nhận timestamp ms. */
  startLoop(tick: (t: number) => void): void;
  /** Đăng ký dọn dẹp thêm (event listeners, geometry ngoài traverse). */
  onCleanup(fn: () => void): void;
  dispose(): void;
}


/** Màu sao theo theme scope — đọc computed --ink tại host (dark: trắng nổi trên
 * tối; light: ink đậm nổi trên sáng). Re-resolve khi data-bp-theme đổi (observer). */
function resolveStarColor(host: HTMLElement): string {
  const v = getComputedStyle(host).getPropertyValue('--ink').trim();
  return v || '#ffffff';
}

function observeTheme(host: HTMLElement, onChange: (color: string) => void): () => void {
  const apply = () => onChange(resolveStarColor(host));
  apply();
  const obs = new MutationObserver(apply);
  // html + body-subtree: theme attr có thể đặt ở bất kỳ wrapper nào phía trên host
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme', 'class'] });
  if (document.body) {
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-bp-theme'], subtree: true });
  }
  return () => obs.disconnect();
}

/** Stage base: renderer + camera + 3 điểm sáng + fog + starfield + loop/dispose. */
function setupStage(THREE: Three, host: HTMLElement): Stage {
  const width = host.clientWidth || 640;
  const height = host.clientHeight || 420;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // fog khớp canvas tối — data cho three, không phải className (rule 1 không áp)
  scene.fog = new THREE.Fog(0x0b0c10, 9, 34);
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
  camera.position.set(0, 1.2, 7.5);

  // 3 điểm sáng: key (trắng) · fill (accent lạnh) · rim (viền sau)
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(5, 8, 5);
  const fill = new THREE.PointLight(0x5e6ad2, 30, 40);
  fill.position.set(-6, 2, -4);
  const rim = new THREE.DirectionalLight(0xbfc9ff, 1.1);
  rim.position.set(0, 3, -8);
  scene.add(key, fill, rim);

  // Starfield 800 hạt — vỏ cầu bán kính 12–28 quanh origin
  const COUNT = 800;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const v: Vec3 = new THREE.Vector3().randomDirection().multiplyScalar(12 + Math.random() * 16);
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.9, sizeAttenuation: true });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  const setStarColor = (cssColor: string) => {
    starMat.color.set(cssColor);
    starMat.needsUpdate = true;
  };

  let raf = 0;
  let disposed = false;
  const cleanups: Array<() => void> = [];

  const onResize = () => {
    const w = host.clientWidth || 640;
    const h = host.clientHeight || 420;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    stars,
    setStarColor,
    renderOnce: () => renderer.render(scene, camera),
    startLoop(tick) {
      const step = (t: number) => {
        if (disposed) return;
        tick(t);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    },
    onCleanup(fn) {
      cleanups.push(fn);
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      cleanups.forEach((fn) => fn());
      scene.traverse((obj) => {
        const mesh = obj as { geometry?: { dispose(): void }; material?: { dispose(): void } & object };
        mesh.geometry?.dispose?.();
        const mat = mesh.material as { dispose(): void } | Array<{ dispose(): void }> | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** Tàu low-poly procedural: hull cylinder xoay ngang + cabin + 2 cánh box
 * flat-shading (look bevel low-poly) + 2 engine emissive + point light đuôi. */
function buildShip(THREE: Three): GroupT {
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.78, 4.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xcfd6e4, metalness: 0.7, roughness: 0.28, flatShading: true }),
  );
  hull.rotation.z = -Math.PI / 2; // mũi hướng +x
  ship.add(hull);

  const cabin = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x5e6ad2, metalness: 0.5, roughness: 0.35, flatShading: true }),
  );
  cabin.position.set(0.4, 0.42, 0);
  cabin.scale.set(1, 0.6, 0.8);
  ship.add(cabin);

  const wingMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b8, metalness: 0.6, roughness: 0.3, flatShading: true });
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.5), wingMat);
    wing.position.set(-0.4, 0, side * 1.15);
    wing.rotation.x = side * 0.16;
    ship.add(wing);
  }

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    emissive: 0x828fff,
    emissiveIntensity: 2.2,
    flatShading: true,
  });
  for (const side of [-1, 1]) {
    const engine = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), engineMat);
    engine.position.set(-2.15, 0, side * 0.52);
    ship.add(engine);
  }
  const tail = new THREE.PointLight(0x828fff, 14, 7);
  tail.position.set(-2.4, 0.2, 0);
  ship.add(tail);
  return ship;
}

/** Dùng chung 3 component — load three + setup + dọn dẹp; lỗi → fallback. */
function useStage(setup: (THREE: Three, host: HTMLElement) => Stage, staticFrame: boolean) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useEffect(() => {
    let disposed = false;
    let stage: Stage | null = null;
    const host = hostRef.current;
    if (!host) return;
    loadThree()
      .then((THREE) => {
        if (disposed) return;
        try {
          stage = setupRef.current(THREE, host);
        } catch {
          if (!disposed) setFailed(true); // WebGL không khả dụng (jsdom/GPU tắt)
        }
      })
      .catch(() => {
        if (!disposed) setFailed(true); // peer-dep `three` thiếu
      });
    return () => {
      disposed = true;
      stage?.dispose();
    };
  }, [epoch, staticFrame]);

  return { hostRef, failed, retry: () => setEpoch((n) => n + 1) };
}

/** Fallback mặc định — khối thông báo tokens-only (consumer thay node riêng). */
function DefaultFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-s2 p-6 text-center">
      <span className="text-body text-ink2">Không render được cảnh 3D — WebGL hoặc peer-dep `three` chưa sẵn sàng.</span>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-lg border border-line bg-s1 px-3 py-1 text-label text-ink hover:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        Thử lại
      </button>
    </div>
  );
}

export interface Scene3DProps {
  className?: string;
  /** Chiều cao canvas (px hoặc CSS) — mặc định 420. */
  height?: number | string;
  /** Node thay thế khi thiếu peer-dep `three` hoặc WebGL. */
  fallback?: ReactNode;
  /** Force 1 frame tĩnh (mặc định: theo prefers-reduced-motion hệ thống). */
  reducedMotion?: boolean;
}

export interface ShipModelProps extends Scene3DProps {
  /** Tự xoay chậm khi không kéo (mặc định bật; reduced-motion tự tắt). */
  autoRotate?: boolean;
}

export interface ScrollFlythroughProps extends Scene3DProps {
  /** Tiến trình bay 0..1 — consumer truyền từ scroll/section progress. */
  progress?: number;
}

/** Scene3D — stage thuần: canvas + lighting 3 điểm + fog + starfield 800 hạt
 * xoay rất chậm. Dùng khi cần nền vũ trụ không có chủ thể. */
export function Scene3D({ className, height = 420, fallback, reducedMotion }: Scene3DProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const staticFrame = reducedMotion ?? reduced;
  const { hostRef, failed, retry } = useStage(
    (THREE, host) => {
      const stage = setupStage(THREE, host);
      stage.onCleanup(observeTheme(host, (c) => stage.setStarColor(c)));
      if (staticFrame) {
        stage.stars.rotation.y = 0.6; // freeze ở frame đẹp
        stage.renderOnce();
        return stage;
      }
      stage.startLoop((t) => {
        stage.stars.rotation.y = t * 0.00004;
      });
      return stage;
    },
    staticFrame,
  );
  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Cảnh không gian 3D — trường sao và sương mù"
      className={`relative overflow-hidden rounded-xl bg-canvas ${className ?? ''}`}
      style={{ height }}
    >
      {failed && (fallback ?? <DefaultFallback onRetry={retry} />)}
    </div>
  );
}

/** ShipModel — tàu low-poly procedural + drag-rotate 360 có inertia (thả ra còn
 * trôi ~1s rồi auto-rotate idle chậm). Kéo bằng pointer (mouse/touch/pen). */
export function ShipModel({ className, height = 420, fallback, reducedMotion, autoRotate = true }: ShipModelProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const staticFrame = reducedMotion ?? reduced;
  const drag = useRef({ x: 0, y: 0, vx: 0, vy: 0, down: false });

  const { hostRef, failed, retry } = useStage(
    (THREE, host) => {
      const stage = setupStage(THREE, host);
      const ship = buildShip(THREE);
      ship.position.set(0.2, 0, 0);
      ship.rotation.set(0.15, 0.6, 0);
      stage.scene.add(ship);
      const dom = stage.renderer.domElement;
      dom.style.touchAction = 'none';
      dom.style.cursor = 'grab';
      const onDown = (e: PointerEvent) => {
        drag.current.down = true;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        dom.style.cursor = 'grabbing';
        dom.setPointerCapture?.(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!drag.current.down) return;
        drag.current.vy = (e.clientX - drag.current.x) * 0.006;
        drag.current.vx = (e.clientY - drag.current.y) * 0.004;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        ship.rotation.y += drag.current.vy;
        ship.rotation.x = Math.max(-0.7, Math.min(0.7, ship.rotation.x + drag.current.vx));
      };
      const onUp = () => {
        drag.current.down = false;
        dom.style.cursor = 'grab';
        // lộ rotation cuối cho test/evidence quan sát (không ghi mỗi frame)
        host.setAttribute('data-rot-y', ship.rotation.y.toFixed(3));
      };
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerup', onUp);
      dom.addEventListener('pointercancel', onUp);
      stage.onCleanup(() => {
        dom.removeEventListener('pointerdown', onDown);
        dom.removeEventListener('pointermove', onMove);
        dom.removeEventListener('pointerup', onUp);
        dom.removeEventListener('pointercancel', onUp);
      });

      if (staticFrame) {
        stage.renderOnce(); // freeze-frame — pose đã set đẹp ở trên
        return stage;
      }
      let last = 0;
      stage.startLoop((t) => {
        const dt = Math.min(64, t - last) / 16.7;
        last = t;
        if (!drag.current.down) {
          drag.current.vy *= Math.pow(0.94, dt); // quán tính decay
          drag.current.vx *= Math.pow(0.94, dt);
          ship.rotation.y += drag.current.vy + (autoRotate ? 0.0035 * dt : 0);
          ship.rotation.x = Math.max(-0.7, Math.min(0.7, ship.rotation.x + drag.current.vx));
        }
        stage.stars.rotation.y = t * 0.00004;
      });
      return stage;
    },
    staticFrame,
  );
  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Mô hình tàu 3D — kéo để xoay 360 độ"
      data-testid="ship-model"
      className={`relative overflow-hidden rounded-xl bg-canvas ${className ?? ''}`}
      style={{ height }}
    >
      {failed && (fallback ?? <DefaultFallback onRetry={retry} />)}
    </div>
  );
}

/** ScrollFlythrough — camera bay theo `progress` 0..1 trên CatmullRom 4 điểm
 * vòng quanh tàu (trên → phải → dưới-trái → trước). Static mode: mỗi progress
 * đổi render lại ĐÚNG 1 frame (reduced-motion vẫn "bay" theo scroll, không loop). */
export function ScrollFlythrough({ className, height = 480, fallback, reducedMotion, progress = 0 }: ScrollFlythroughProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const staticFrame = reducedMotion ?? reduced;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const applyRef = useRef<((p: number) => void) | null>(null);

  const { hostRef, failed, retry } = useStage(
    (THREE, host) => {
      const stage = setupStage(THREE, host);
      const ship = buildShip(THREE);
      ship.rotation.y = 0.4;
      stage.scene.add(ship);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 2.4, 8.5),
        new THREE.Vector3(7.5, 1.2, 2.5),
        new THREE.Vector3(4.5, -1.6, -5.5),
        new THREE.Vector3(-5.5, 0.8, 5.5),
      ]);
      stage.onCleanup(observeTheme(host, (c) => stage.setStarColor(c)));
      const apply = (p: number) => {
        const at = curve.getPointAt(Math.min(0.999, Math.max(0, p)));
        stage.camera.position.copy(at);
        // luôn nhìn vào tàu — orbit flythrough (ref: camera quét quanh chủ thể)
        stage.camera.lookAt(0.2, 0, 0);
      };
      applyRef.current = (p: number) => {
        apply(p);
        stage.renderOnce();
      };

      if (staticFrame) {
        apply(progressRef.current); // frame tĩnh theo progress hiện tại
        return stage;
      }
      apply(progressRef.current);
      let last = 0;
      stage.startLoop((t) => {
        const dt = Math.min(64, t - last) / 16.7;
        last = t;
        apply(progressRef.current);
        ship.rotation.y += 0.0028 * dt;
        stage.stars.rotation.y = t * 0.00004;
      });
      return stage;
    },
    staticFrame,
  );

  // progress đổi → cập nhật camera. Động: loop tự đọc ref (không re-render);
  // tĩnh: render lại đúng 1 frame.
  useEffect(() => {
    if (staticFrame) applyRef.current?.(progress);
  }, [progress, staticFrame]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Cảnh bay 3D quanh mô hình tàu theo tiến trình cuộn"
      className={`relative overflow-hidden rounded-xl bg-canvas ${className ?? ''}`}
      style={{ height }}
    >
      {failed && (fallback ?? <DefaultFallback onRetry={retry} />)}
    </div>
  );
}
