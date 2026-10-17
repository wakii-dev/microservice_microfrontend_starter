// ParityCompare — SO SÁNH CẠNH NHANH với antd THẬT (devDep parity-only, không ship
// runtime). Mỗi story mới bọc cặp <Parity antd={…} ours={…}/> + ghi parity matrix
// (antd token → tokens.css) trong phần notes của story.
import type { ReactNode } from 'react';

export function Parity({ antd, ours }: { antd: ReactNode; ours: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <section>
        <h4 style={{ margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase', color: '#8a8f98' }}>
          antd (thật)
        </h4>
        <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8 }}>{antd}</div>
      </section>
      <section>
        <h4 style={{ margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase', color: '#8a8f98' }}>
          @wakii/ui-kit
        </h4>
        <div style={{ padding: 16, border: '1px dashed #1677ff', borderRadius: 8 }}>{ours}</div>
      </section>
    </div>
  );
}

/** Parity matrix chuẩn — antd v6 default (seed.js đọc trực tiếp từ package cài)
 * → tokens.css. Copy vào phần notes của mỗi story mới. */
export const PARITY_MATRIX = `| antd token | giá trị | tokens.css |
| colorPrimary | #1677ff | --accent |
| colorPrimaryHover | #4096ff | --accent-hi |
| colorText | rgba(0,0,0,.88) | --ink |
| colorTextSecondary | rgba(0,0,0,.65) | --ink2 |
| colorTextTertiary | rgba(0,0,0,.45) | --ink3 |
| colorBorder | #d9d9d9 | --line |
| colorBorderSecondary | #f0f0f0 | --line2 |
| colorBgLayout | #f5f5f5 | --c-canvas |
| colorBgContainer | #ffffff | --c-s1/--c-s2 |
| colorFillQuaternary | #fafafa | --c-s3 |
| borderRadius 6 / LG 8 | 6/8px | --r-2/--r-3 |
| fontSize 14 / controlHeight 32 | 14/32px | --fs-body / h-8 utilities |
| fontFamily | system stack | --f |`;
