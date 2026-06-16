import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { RecommendationValue, RecommendationWithDetails } from '@betterreviews/shared';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { RecommendationSummary } from '../components/RecommendationSummary';
import { PhotoGrid } from '../components/PhotoGrid';
import { SaveButton } from '../components/SaveButton';
import { Modal } from '../components/Modal';
import { RecommendationForm } from '../components/RecommendationForm';

const VALUE_BADGE: Record<RecommendationValue, string> = {
  yes: '👍 Recommends',
  maybe: '🤔 On the fence',
  no: '👎 Would skip',
};

export function PlaceDetailPage() {
  const { id = '' } = useParams();
  const [showForm, setShowForm] = useState(false);

  const place = useAsync(() => api.getPlace(id), [id]);
  const recs = useAsync(() => api.listRecommendations(id), [id]);
  const reasonTags = useAsync(() => api.listReasonTags(), []);

  const onSubmitted = () => {
    setShowForm(false);
    place.reload();
    recs.reload();
  };

  if (place.loading) return <p className="muted page">Loading…</p>;
  if (place.error || !place.data)
    return (
      <div className="page">
        <p className="form-error">{place.error ?? 'Place not found.'}</p>
        <Link to="/" className="btn btn--ghost">
          ← Back to discover
        </Link>
      </div>
    );

  const p = place.data;
  const meta = [p.category, p.address, p.city].filter(Boolean).join(' · ');

  return (
    <div className="page place-detail">
      <Link to="/" className="back-link">
        ← Discover
      </Link>

      <header className="place-detail__header">
        <div className="place-detail__hero">
          {p.coverPhotoUrl ? (
            <img src={p.coverPhotoUrl} alt={p.name} />
          ) : (
            <div className="place-card__media-empty">📷</div>
          )}
        </div>
        <div className="place-detail__intro">
          <div className="place-detail__title-row">
            <h1>{p.name}</h1>
            <MatchScoreBadge score={p.matchScore} size="lg" />
          </div>
          {meta && <p className="place-detail__meta">{meta}</p>}
          <p className="place-detail__match">{p.matchScore.label}</p>
          <RecommendationSummary summary={p.recommendationSummary} />
          <div className="place-detail__actions">
            <button className="btn btn--primary" onClick={() => setShowForm(true)}>
              Recommend this place
            </button>
            <SaveButton placeId={p.id} saved={p.saved} onChange={() => place.reload()} />
          </div>
        </div>
      </header>

      {p.reasonTagSummary.length > 0 && (
        <section className="section">
          <h2 className="section__title">What people mention</h2>
          <div className="tag-picker__chips">
            {p.reasonTagSummary.map((tag) => (
              <span key={tag.id} className={`chip chip--${tag.sentiment} chip--static`}>
                {tag.label} · {tag.count}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section__title">Photos</h2>
        <PhotoGrid photos={p.photos} />
      </section>

      <section className="section">
        <h2 className="section__title">Recommendations</h2>
        {recs.loading && <p className="muted">Loading…</p>}
        {recs.data && recs.data.length === 0 && (
          <p className="muted">No recommendations yet. Be the first!</p>
        )}
        {recs.data && recs.data.length > 0 && (
          <ul className="rec-list">
            {recs.data.map((rec) => (
              <RecommendationItem key={rec.id} rec={rec} />
            ))}
          </ul>
        )}
      </section>

      {showForm && (
        <Modal title={`Recommend ${p.name}`} onClose={() => setShowForm(false)}>
          <RecommendationForm
            placeId={p.id}
            placeName={p.name}
            reasonTags={reasonTags.data ?? []}
            onSubmitted={onSubmitted}
          />
        </Modal>
      )}
    </div>
  );
}

function RecommendationItem({ rec }: { rec: RecommendationWithDetails }) {
  return (
    <li className="rec-item">
      <div className="rec-item__head">
        {rec.user.avatar_url && (
          <img className="rec-item__avatar" src={rec.user.avatar_url} alt="" />
        )}
        <div>
          <strong>{rec.user.display_name}</strong>
          <span className={`rec-item__value rec-item__value--${rec.recommendation_value}`}>
            {VALUE_BADGE[rec.recommendation_value]}
          </span>
        </div>
      </div>
      {rec.reasonTags.length > 0 && (
        <div className="tag-picker__chips">
          {rec.reasonTags.map((tag) => (
            <span key={tag.id} className={`chip chip--${tag.sentiment} chip--static`}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
      {rec.photos.length > 0 && <PhotoGrid photos={rec.photos} />}
    </li>
  );
}
