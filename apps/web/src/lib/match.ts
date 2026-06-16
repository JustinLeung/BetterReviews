import type { MatchScore, PlaceWithSummary } from '@betterreviews/shared';

/** Below this many recommendations a score is still "building" — flag it. */
export const LOW_CONFIDENCE_BELOW = 3;

/**
 * Score band → modifier suffix. Single source of truth for match coloring
 * across pins, badges, and inline numbers. Thresholds account for the
 * shrinkage in `calculateMatchScore`, which compresses scores toward 50.
 */
export function matchBand(score: number | null): 'high' | 'mid' | 'low' | 'none' {
  if (score == null) return 'none';
  if (score >= 70) return 'high';
  if (score >= 50) return 'mid';
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

/** Honest one-liner about how much signal a score rests on. */
export function sampleNote(match: MatchScore): string {
  const n = match.sampleSize;
  if (n === 0) return 'No recommendations yet';
  return `Based on ${n} recommendation${n === 1 ? '' : 's'}`;
}

/** True when the score rests on too little signal to be confident. */
export function isLowConfidence(match: MatchScore): boolean {
  return match.sampleSize > 0 && match.sampleSize < LOW_CONFIDENCE_BELOW;
}

/** Distinct, sorted category labels present in a set of places. */
export function categoriesOf(places: PlaceWithSummary[]): string[] {
  const set = new Set<string>();
  for (const p of places) if (p.category) set.add(p.category);
  return [...set].sort((a, b) => a.localeCompare(b));
}
