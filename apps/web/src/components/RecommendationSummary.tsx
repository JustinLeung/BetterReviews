import type { RecommendationSummary as Summary } from '@betterreviews/shared';

/** Compact yes/maybe/no breakdown with a proportional bar. */
export function RecommendationSummary({ summary }: { summary: Summary }) {
  const { yes, maybe, no, total } = summary;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="rec-summary">
      <div className="rec-summary__bar" aria-hidden>
        <span className="seg seg--yes" style={{ width: `${pct(yes)}%` }} />
        <span className="seg seg--maybe" style={{ width: `${pct(maybe)}%` }} />
        <span className="seg seg--no" style={{ width: `${pct(no)}%` }} />
      </div>
      <div className="rec-summary__counts">
        <span className="count count--yes">👍 {yes}</span>
        <span className="count count--maybe">🤔 {maybe}</span>
        <span className="count count--no">👎 {no}</span>
        <span className="count count--total">{total} {total === 1 ? 'rec' : 'recs'}</span>
      </div>
    </div>
  );
}
