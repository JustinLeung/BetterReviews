// Explicit named re-exports (not `export *`) so bundlers can statically detect
// the named exports from this CommonJS package. Types are erased at runtime.
export type * from './types';
export { RECOMMENDATION_VALUES, VISIBILITIES, REASON_SENTIMENTS } from './constants';
export {
  SCORE_WEIGHTS,
  MIN_SAMPLE_SIZE,
  calculateMatchScore,
  matchScoreLabel,
} from './score';
