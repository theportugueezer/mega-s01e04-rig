import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/index.js';

const NORMAL = '2026-11-01';
const EMPTY = '2026-11-02';
const BAD = '2026-11-03';
const MISSING = '2026-11-04';

const line = (at: string, job: string, status: string, owner: string | null, error?: string) =>
  JSON.stringify({ at, job, status, owner, ...(error ? { error } : {}) });

let runsDir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  // b-job is logged first so the sort by job is exercised.
  writeFileSync(
    join(runsDir, `${NORMAL}.jsonl`),
    [
      line('2026-11-01T01:00:00+01:00', 'b-job', 'ok', 'sam'),
      line('2026-11-01T01:05:00+01:00', 'a-job', 'ok', 'ivy'),
      line('2026-11-01T02:00:00+01:00', 'b-job', 'retry', 'sam', 'timeout'),
      line('2026-11-01T03:00:00+01:00', 'b-job', 'fail', 'sam', 'gave up'),
    ].join('\n') + '\n',
  );
  writeFileSync(join(runsDir, `${EMPTY}.jsonl`), '');
  writeFileSync(
    join(runsDir, `${BAD}.jsonl`),
    line('2026-11-03T01:00:00+01:00', 'good-job', 'ok', 'papa') + '\n{"at":"2026-11-03T02:00:00+01:00","job":"cut-o',
  );
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });
});

afterAll(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

// The first cell of each body row is the job.
const pageJobs = (html: string) =>
  [...html.matchAll(/<tr><td>([^<]*)<\/td>/g)].map((m) => m[1]);

describe('GET /digest/:night', () => {
  it('200s with one table row per job, sorted, with retry and fail visible', async () => {
    const res = await app.request(`/digest/${NORMAL}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(pageJobs(html)).toEqual(['a-job', 'b-job']);
    expect(html).toContain('<td>sam</td><td>3</td><td>1</td><td class="warn">fail</td><td>gave up</td>');
    expect(html).not.toContain('did not parse');
  });

  it('404s for a night with no file', async () => {
    expect((await app.request(`/digest/${MISSING}`)).status).toBe(404);
  });

  it('says nothing ran for the empty night', async () => {
    const res = await app.request(`/digest/${EMPTY}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
    expect(pageJobs(html)).toEqual([]);
  });

  it('renders the good row and the did-not-parse note for a night with a bad line', async () => {
    const res = await app.request(`/digest/${BAD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(pageJobs(html)).toEqual(['good-job']);
    expect(html).toContain('1 line did not parse');
  });
});

describe('GET /api/digest/:night', () => {
  const night = async (name: string) => {
    const res = await app.request(`/api/digest/${name}`);
    return { res, body: (await res.json()) as Night };
  };

  it('200s with the same jobs, in the same order, as the page', async () => {
    const { res, body } = await night(NORMAL);
    const html = await (await app.request(`/digest/${NORMAL}`)).text();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body.rows.map((r) => r.job)).toEqual(pageJobs(html));
    expect(body.rows.map((r) => r.job)).toEqual(['a-job', 'b-job']);
    expect(body.badLines).toBe(0);
  });

  it('404s as JSON for a night with no file', async () => {
    const res = await app.request(`/api/digest/${MISSING}`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such night' });
  });

  it('gives no rows and no bad lines for the empty night', async () => {
    const { res, body } = await night(EMPTY);
    expect(res.status).toBe(200);
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('counts the bad line and keeps the good row', async () => {
    const { res, body } = await night(BAD);
    expect(res.status).toBe(200);
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['good-job']);
  });
});
