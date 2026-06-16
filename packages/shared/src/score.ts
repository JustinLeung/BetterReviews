import type { MatchScore, RecommendationSummary } from './types';

/**
 * v0 match-score weights. The whole point of isolating this function is that it
 * can be swapped for a real personalized scorer later (friend weighting,
 * people-like-you similarity, KNN clustering, taste profiles, …) without
 * touching callers.
 */
export const SCORE_WEIGHTS: Record<'yes' | 'maybe' | 'no', number> = {
  yes: 1,
  maybe: 0.4,
  no: 0,
};

/** Minimum number of recommendations before we show a score at all. */
export const MIN_SAMPLE_SIZE = 1;

/**
 * Placeholder personalized score.
 *
 * v0 is a simple weighted average of the aggregate yes/maybe/no signal:
 *
 *     score = (yes*1 + maybe*0.4 + no*0) / total * 100
 *
 * It is intentionally NOT personalized yet. Replace this with a real scorer
 * later; keep the signature stable so the API and client are unaffected.
 */
export function calculateMatchScore(
  summary: Pick<RecommendationSummary, 'yes' | 'maybe' | 'no'>,
): MatchScore {
  const yes = summary.yes ?? 0;
  const maybe = summary.maybe ?? 0;
  const no = summary.no ?? 0;
  const total = yes + maybe + no;

  if (total < MIN_SAMPLE_SIZE) {
    return {
      matchScore: null,
      label: 'Not enough recommendations yet',
      sampleSize: total,
    };
  }

  const weighted =
    (yes * SCORE_WEIGHTS.yes + maybe * SCORE_WEIGHTS.maybe + no * SCORE_WEIGHTS.no) /
    total;
  const matchScore = Math.round(weighted * 100);

  return {
    matchScore,
    label: matchScoreLabel(matchScore),
    sampleSize: total,
  };
}

/** Human-readable label for a score. Framed as "match", never universal judgment. */
export function matchScoreLabel(score: number): string {
  if (score >= 80) return 'Recommended by people like you';
  if (score >= 60) return 'Worth a visit';
  if (score >= 40) return 'Mixed — could go either way';
  return 'Not a strong match for you';
}
