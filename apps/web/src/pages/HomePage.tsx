import { useMemo, useState } from 'react';
import { api, type PlaceFilters } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { PlaceCard } from '../components/PlaceCard';

/** Radius for the "near me" filter, in metres. */
const NEAR_RADIUS_M = 25_000;

/** Home / Discover — a photo-first list of places. */
export function HomePage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const filters = useMemo<PlaceFilters>(() => {
    const f: PlaceFilters = {};
    if (appliedSearch) f.search = appliedSearch;
    if (near) {
      f.nearLat = near.lat;
      f.nearLng = near.lng;
      f.radius = NEAR_RADIUS_M;
    }
    return f;
  }, [appliedSearch, near]);

  const { data: places, loading, error, reload } = useAsync(
    () => api.listPlaces(filters),
    [filters],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const toggleNearMe = () => {
    if (near) {
      setNear(null);
      setGeoError(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeoError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNear({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message || 'Could not get your location.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="page">
      <section className="hero">
        <h1 className="hero__title">Places people like you actually recommend</h1>
        <p className="hero__subtitle">
          Photo-first picks from friends and people with similar taste in Munich.
        </p>
        <form className="searchbar" onSubmit={onSubmit}>
          <input
            type="search"
            className="searchbar__input"
            placeholder="Search places or addresses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
          <button
            type="button"
            className={`btn ${near ? 'btn--primary' : 'btn--ghost'}`}
            onClick={toggleNearMe}
            disabled={locating}
            aria-pressed={Boolean(near)}
          >
            {locating ? 'Locating…' : near ? '📍 Near you ✓' : '📍 Near me'}
          </button>
          {appliedSearch && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setSearch('');
                setAppliedSearch('');
              }}
            >
              Clear
            </button>
          )}
        </form>
        {geoError && <p className="form-error">{geoError}</p>}
        {near && !geoError && (
          <p className="muted">Showing places within {NEAR_RADIUS_M / 1000} km, nearest first.</p>
        )}
      </section>

      {loading && <p className="muted">Loading places…</p>}
      {error && (
        <p className="form-error">
          {error}{' '}
          <button className="btn btn--ghost" onClick={reload}>
            Retry
          </button>
        </p>
      )}

      {places && places.length === 0 && !loading && (
        <p className="muted">
          No places found
          {appliedSearch ? ` for “${appliedSearch}”` : ''}
          {near ? ' near you' : ''}.
        </p>
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
