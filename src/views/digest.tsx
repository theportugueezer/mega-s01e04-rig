import type { DigestRow, Night } from '../digest/index.js';

const DASH = '—';

// Retries of 3 or more, or any job whose last status is fail, are marked (plan 2a).
const RETRY_WARN_AT = 3;

function Row({ row }: { row: DigestRow }) {
  const warnRetries = row.retries >= RETRY_WARN_AT;
  const warnStatus = row.lastStatus === 'fail';
  return (
    <tr>
      <td>{row.job}</td>
      <td>{row.owner ?? DASH}</td>
      <td>{row.runs}</td>
      <td class={warnRetries ? 'warn' : undefined}>{row.retries}</td>
      <td class={warnStatus ? 'warn' : undefined}>{row.lastStatus}</td>
      <td>{row.lastError ?? DASH}</td>
      <td>{row.first}</td>
      <td>{row.last}</td>
    </tr>
  );
}

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.badLines > 0 && (
        <p class="warn">
          {night.badLines} {night.badLines === 1 ? 'line' : 'lines'} did not parse
        </p>
      )}
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => (
              <Row row={row} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
