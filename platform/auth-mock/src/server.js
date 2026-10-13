// Entry point — listen theo PORT (conventions/05: auth-mock 8090)
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8090);
const host = '0.0.0.0';

const app = await buildApp();
try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error({ err }, 'failed to start auth-mock');
  process.exit(1);
}
