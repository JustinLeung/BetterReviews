import { useMemo, useState } from 'react';
import { api, type PlaceFilters } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { PlaceCard } from '../components/PlaceCard';

/** Home / Discover — a photo-first list of places. */
export function HomePage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const filters = useMemo<PlaceFilters>(
    () => (appliedSearch ? { search: appliedSearch } : {}),
    [appliedSearch],
  );

  const { data: places, loading, error, reload } = useAsync(
    () => api.listPlaces(filters),
    [filters],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
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
        <p className="muted">No places found{appliedSearch ? ` for “${appliedSearch}”` : ''}.</p>
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
