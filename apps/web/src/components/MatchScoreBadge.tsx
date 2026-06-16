import type { MatchScore } from '@betterreviews/shared';
import { matchBand, scoreText } from '../lib/match';

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
  const cls = `match-badge match-badge--${size} match-badge--${matchBand(score.matchScore)}`;
  return (
    <div className={cls} title={score.label}>
      <span className="match-badge__value">{scoreText(score)}</span>
      <span className="match-badge__caption">Your Match</span>
    </div>
  );
}
