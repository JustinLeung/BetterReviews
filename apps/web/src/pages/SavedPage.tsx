import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { PlaceCard } from '../components/PlaceCard';

/** Saved places for the current (mock) user. */
export function SavedPage() {
  const { data: places, loading, error, reload } = useAsync(() => api.listSavedPlaces(), []);

  return (
    <div className="page">
      <h1 className="page__title">Saved places</h1>

      {loading && <p className="muted">Loading…</p>}
      {error && (
        <p className="form-error">
          {error}{' '}
          <button className="btn btn--ghost" onClick={reload}>
            Retry
          </button>
        </p>
      )}

      {places && places.length === 0 && !loading && (
        <div className="empty-state">
          <p>You haven't saved any places yet.</p>
          <Link to="/" className="btn btn--primary">
            Discover places
          </Link>
        </div>
      )}

      {places && places.length > 0 && (
        <div className="place-grid">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}
