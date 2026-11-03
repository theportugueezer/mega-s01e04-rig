import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunLine, RunStatus } from './types.js';

const STATUSES: ReadonlySet<string> = new Set<RunStatus>(['ok', 'retry', 'fail']);

// Parse one line at the edge (styleguide: parse input, trust types after). Null = bad line.
export function parseLine(line: string): RunLine | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.has(o.status)) return null;
  const owner = o.owner === undefined || o.owner === null ? null : typeof o.owner === 'string' ? o.owner : null;
  const out: RunLine = { at: o.at, job: o.job, status: o.status as RunStatus, owner };
  if (typeof o.error === 'string') out.error = o.error;
  return out;
}

// Fold the night's lines into one row per job, in log order, then sort by job.
export function digest(lines: RunLine[]): DigestRow[] {
  const rows = new Map<string, DigestRow>();
  for (const l of lines) {
    const row = rows.get(l.job);
    if (!row) {
      rows.set(l.job, {
        job: l.job,
        owner: l.owner,
        runs: 1,
        retries: l.status === 'retry' ? 1 : 0,
        lastStatus: l.status,
        lastError: l.error ?? null,
        first: l.at,
        last: l.at,
      });
      continue;
    }
    row.runs += 1;
    if (l.status === 'retry') row.retries += 1;
    row.lastStatus = l.status;
    if (l.error !== undefined) row.lastError = l.error;
    if (row.owner === null && l.owner !== null) row.owner = l.owner;
    if (l.at < row.first) row.first = l.at;
    if (l.at > row.last) row.last = l.at;
  }
  return [...rows.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
}

export function nightFile(runsDir: string, night: string): string {
  return join(runsDir, `${night}.jsonl`);
}

// The night's rows, or null when the file is not there. A bad line is counted, never thrown.
export const readNight: ReadNight = (runsDir, night) => {
  const file = nightFile(runsDir, night);
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const lines: RunLine[] = [];
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const l = parseLine(raw);
    if (l) lines.push(l);
    else badLines += 1;
  }
  return { night, rows: digest(lines), badLines };
};
