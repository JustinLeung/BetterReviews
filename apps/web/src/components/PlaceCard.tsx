import { Link } from 'react-router-dom';
import type { PlaceWithSummary } from '@betterreviews/shared';
import { MatchScoreBadge } from './MatchScoreBadge';
import { SaveButton } from './SaveButton';
import { RecommendationSummary } from './RecommendationSummary';

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Photo-first discover card. */
export function PlaceCard({ place }: { place: PlaceWithSummary }) {
  const meta = [
    place.distanceMeters != null ? formatDistance(place.distanceMeters) : null,
    place.category,
    place.city,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link to={`/places/${place.id}`} className="place-card">
      <div className="place-card__media">
        {place.coverPhotoUrl ? (
          <img src={place.coverPhotoUrl} alt={place.name} loading="lazy" />
        ) : (
          <div className="place-card__media-empty">📷</div>
        )}
        <div className="place-card__badge">
          <MatchScoreBadge score={place.matchScore} />
        </div>
      </div>

      <div className="place-card__body">
        <div className="place-card__title-row">
          <h3 className="place-card__name">{place.name}</h3>
          <SaveButton placeId={place.id} saved={place.saved} />
        </div>
        {meta && <p className="place-card__meta">{meta}</p>}
        <p className="place-card__match">{place.matchScore.label}</p>
        <RecommendationSummary summary={place.recommendationSummary} />
      </div>
    </Link>
  );
}
