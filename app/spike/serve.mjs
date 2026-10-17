// Static server 0-dep cho spike (CORS mở — host :3000 fetch remoteEntry cross-origin :4001)
// Usage: node serve.mjs <dir> <port>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const dir = process.argv[2];
const port = Number(process.argv[3]);
const MIME = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(dir, normalize(urlPath).replace(/^([/\\])+/, ''));
    if (urlPath.endsWith('/')) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end('not found');
  }
}).listen(port, () => console.log(`spike static: ${dir} → http://localhost:${port}`));
