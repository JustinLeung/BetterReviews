import type { PlaceWithSummary } from '@betterreviews/shared';
import { isLowConfidence, sampleNote } from '../lib/match';

/** The honest evidence behind a match score: how many people, and why. */
export function SignalRow({ place }: { place: PlaceWithSummary }) {
  const tags = place.topReasonTags.slice(0, 3);
  return (
    <div className="signal">
      <div className="signal__meta">
        <span>{sampleNote(place.matchScore)}</span>
        {isLowConfidence(place.matchScore) && (
          <span className="signal__building">· still building signal</span>
        )}
      </div>
      {tags.length > 0 && (
        <div className="signal__tags">
          {tags.map((t) => (
            <span key={t.id} className={`chip chip--${t.sentiment} chip--static signal__tag`}>
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
