/**
 * Enumerated values shared by client and server.
 *
 * These are runtime arrays (not just types) so both sides can iterate over the
 * options (e.g. to render pickers) and validate input against a single source
 * of truth.
 */

export const RECOMMENDATION_VALUES = ['yes', 'maybe', 'no'] as const;

export const VISIBILITIES = ['private', 'friends', 'public'] as const;

export const REASON_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
