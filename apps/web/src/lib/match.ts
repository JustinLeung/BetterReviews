import type { MatchScore } from '@betterreviews/shared';

/** Score band → modifier suffix, shared by the map pins and feed scores. */
export function matchBand(score: number | null): 'high' | 'mid' | 'low' | 'none' {
  if (score == null) return 'none';
  if (score >= 75) return 'high';
  if (score >= 55) return 'mid';
  return 'low';
}

/** Short class suffix (`s-hi` etc.) for inline score numbers. */
export function scoreClass(score: number | null): string {
  const map = { high: 's-hi', mid: 's-mid', low: 's-lo', none: 's-none' } as const;
  return map[matchBand(score)];
}

/** Text to render for a score (`88%` or `New`). */
export function scoreText(match: MatchScore): string {
  return match.matchScore == null ? 'New' : `${match.matchScore}%`;
}
