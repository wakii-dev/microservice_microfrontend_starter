// QRCode core — wrapper typed quanh qrcode-generator vendored (MIT, xem
// `qrcode-generator.vendor.ts`). Auto version (typeNumber 0 → 1..40), byte mode
// UTF-8 (wire stringToBytes sang funcs['UTF-8'] — text Việt/emoji không vỡ),
// best-mask chọn tự động trong lib. Không deps runtime khác.
import { qrcode } from './qrcode-generator.vendor.js';

// Vendor là JS var-based — TS chỉ suy ra `(t, lvl) => {}`. Khai báo surface thật
// để consumer type-checked (casting qua unknown — biên duy nhất chạm code vendored).
interface QrInstance {
  addData(data: string, mode?: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
}
interface QrFactory {
  (typeNumber: number, errorCorrectionLevel: string): QrInstance;
  stringToBytes: (s: string) => number[];
  stringToBytesFuncs: Record<string, (s: string) => number[]>;
}
const qrcodeFn = qrcode as unknown as QrFactory;

// UTF-8 multibyte cho byte mode (default của lib chỉ charCodeAt & 0xff — mất dấu)
qrcodeFn.stringToBytes = qrcodeFn.stringToBytesFuncs['UTF-8'];

export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H';

/** Ma trận module của 1 QR — count×count, isDark(row, col). */
export interface QrMatrix {
  count: number;
  isDark: (row: number, col: number) => boolean;
}

const LEVELS: QrErrorLevel[] = ['L', 'M', 'Q', 'H'];

/** Sinh ma trận QR cho text — ném Error nếu value vượt capacity v40-L (~2953 bytes UTF-8). */
export function makeQrMatrix(value: string, level: QrErrorLevel = 'M'): QrMatrix {
  const lvl = LEVELS.includes(level) ? level : 'M';
  const qr = qrcodeFn(0, lvl); // 0 = auto version
  qr.addData(value, 'Byte');
  qr.make();
  return {
    count: qr.getModuleCount(),
    isDark: (row, col) => qr.isDark(row, col),
  };
}

/** Path data SVG (mỗi module đậm = 1 ô vuông unit) — fill 1 lần, sắc nét mọi size. */
export function matrixToPath(m: QrMatrix): string {
  let d = '';
  for (let r = 0; r < m.count; r++) {
    for (let c = 0; c < m.count; c++) {
      if (m.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return d;
}
