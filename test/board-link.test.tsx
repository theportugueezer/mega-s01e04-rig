import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('board link', () => {
  it('links each night on disk to its digest with counts', async () => {
    const html = await (await createApp(config).request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('href="/digest/2026-10-27"');
    const row = html.match(/<li>.*?2026-10-28<\/a>.*?<\/li>/s)?.[0] ?? '';
    expect(row).toMatch(/ok \d+/);
    expect(row).toMatch(/fail <span class="warn">1<\/span>/);
  });
});
