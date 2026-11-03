import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/index.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestPage } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

const NIGHT_PARAM = /^\d{4}-\d{2}-\d{2}$/;

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const name = c.req.param('night');
    const night = NIGHT_PARAM.test(name) ? readNight(config.runsDir, name) : null;
    if (!night) return c.text('no such night', 404);
    return c.html(
      <Layout title={`digest · ${night.night}`} lane={lane()}>
        <DigestPage night={night} />
      </Layout>,
    );
  });

  // Agents read this one; it is the same Night the page renders, unreshaped (ADR 0001).
  app.get('/api/digest/:night', (c) => {
    const name = c.req.param('night');
    const night = NIGHT_PARAM.test(name) ? readNight(config.runsDir, name) : null;
    return night ? c.json(night) : c.json({ error: 'no such night' }, 404);
  });

  return app;
}
