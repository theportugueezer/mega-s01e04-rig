import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';
import { readNight } from '../src/digest/index.js';

const config: RigConfig = {
  adapter: 'test',
  installed: '2026-10-28',
  beatEverySeconds: 60,
  runsDir: 'runs',
};

describe('GET /api/digest/:night', () => {
  it('serves the night as JSON with the same jobs, in the same order, as readNight', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(
      readNight('runs', '2026-10-28')!.rows.map((r) => r.job),
    );
    expect(body.badLines).toBe(1);
  });

  it('404s as JSON for a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such night' });
  });

  it('404s for a malformed night', async () => {
    const res = await createApp(config).request('/api/digest/..%2Fpackage');
    expect(res.status).toBe(404);
  });
});
