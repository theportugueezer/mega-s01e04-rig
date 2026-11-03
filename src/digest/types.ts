// Plan morning-digest § 1. The shape every part of section 2 builds against.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, as logged.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row of the digest: one job, folded over the night.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  first: string;
  last: string;
};

// A night on disk, read. `badLines` counts lines that did not parse; they are never thrown.
export type Night = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// readNight(runsDir, night): the night's rows, sorted by job; null when runs/<night>.jsonl
// does not exist. Implemented in ./read.ts.
export type ReadNight = (runsDir: string, night: string) => Night | null;
