import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest page', () => {
  afterEach(() => {
    delete process.env.LANE_MARKER;
  });

  it('renders the night with the lane banner', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('TEST-MARKER');
  });

  it('404s for a night with no file or a bad param', async () => {
    const app = createApp(config);
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
    expect((await app.request('/digest/nope')).status).toBe(404);
  });
});
