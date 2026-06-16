import type { MatchScore } from '@betterreviews/shared';

function band(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid';
  if (score >= 40) return 'low';
  return 'verylow';
}

/**
 * Displays the placeholder personalized match score. Framed as "match",
 * never as a universal rating.
 */
export function MatchScoreBadge({
  score,
  size = 'sm',
}: {
  score: MatchScore;
  size?: 'sm' | 'lg';
}) {
  const hasScore = score.matchScore != null;
  const cls = `match-badge match-badge--${size} match-badge--${
    hasScore ? band(score.matchScore as number) : 'none'
  }`;
  return (
    <div className={cls} title={score.label}>
      <span className="match-badge__value">{hasScore ? `${score.matchScore}%` : 'New'}</span>
      <span className="match-badge__caption">Your Match</span>
    </div>
  );
}
