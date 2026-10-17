// Probe headless — verify Dashboard chart vẽ thật + dark theme CSS var (batch ⑦-fix).
// Chạy: vite build + preview (hoặc dev) rồi `node scripts/verify-chart.mjs <url>`.
// CHART: canvas tồn tại + kích thước + số pixel không-trong suốt (>1000 = đã vẽ).
// DARK: set data-bp-theme=dark trên documentElement → --c-canvas phải đổi giá trị
// (dark.css được kéo thì var đổi; thiếu thì light === dark → toggle vô hiệu).
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage();
const messages = [];
page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500); // chart.js lazy import + animation chạy xong

const chartInfo = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { canvas: false };
  let painted = 0;
  const ctx = canvas.getContext('2d');
  if (ctx && canvas.width > 0 && canvas.height > 0) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) painted++;
  }
  return {
    canvas: true,
    attr: `${canvas.width}x${canvas.height}`,
    cssSize: `${canvas.style.width || '(auto)'} × ${canvas.style.height || '(auto)'}`,
    paintedPixels: painted,
  };
});
console.log('CHART:', JSON.stringify(chartInfo));

const darkInfo = await page.evaluate(() => {
  const readCanvasVar = () => getComputedStyle(document.documentElement).getPropertyValue('--c-canvas').trim();
  const light = readCanvasVar();
  document.documentElement.setAttribute('data-bp-theme', 'dark');
  const dark = readCanvasVar();
  document.documentElement.removeAttribute('data-bp-theme');
  return { light, dark, changed: light !== dark && dark !== '' };
});
console.log('DARK:', JSON.stringify(darkInfo));

const interesting = messages.filter((m) => m.includes('[error]') || m.includes('[warning]') || m.includes('[pageerror]'));
console.log('CONSOLE:', interesting.length ? `\n${interesting.slice(0, 10).join('\n')}` : '(sạch)');

await browser.close();
