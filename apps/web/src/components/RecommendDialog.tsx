import { useMemo, useState } from 'react';
import type { PlaceWithSummary } from '@betterreviews/shared';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { Modal } from './Modal';
import { RecommendationForm } from './RecommendationForm';

/**
 * Global "Recommend a place" flow: pick an existing place, then drop into the
 * standard recommendation form. Reached from the header CTA.
 */
export function RecommendDialog({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState<PlaceWithSummary | null>(null);
  const [query, setQuery] = useState('');

  const places = useAsync(() => api.listPlaces(), []);
  const reasonTags = useAsync(() => api.listReasonTags(), []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = places.data ?? [];
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [places.data, query]);

  if (picked) {
    return (
      <Modal title={`Recommend ${picked.name}`} onClose={onClose}>
        <RecommendationForm
          placeId={picked.id}
          placeName={picked.name}
          reasonTags={reasonTags.data ?? []}
          onSubmitted={onClose}
        />
      </Modal>
    );
  }

  return (
    <Modal title="Recommend a place" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 14 }}>
        Pick a place you'd vouch for to a friend.
      </p>
      <input
        type="search"
        className="field__input"
        placeholder="Search places…"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      {places.loading && <p className="muted">Loading places…</p>}
      {places.error && <p className="form-error">{places.error}</p>}

      <div className="pick-list">
        {matches.map((p) => (
          <button key={p.id} className="pick-row" onClick={() => setPicked(p)}>
            <div className="pick-row__thumb">
              {p.coverPhotoUrl ? <img src={p.coverPhotoUrl} alt={p.name} /> : '🍽️'}
            </div>
            <div>
              <div className="pick-row__name">{p.name}</div>
              <div className="pick-row__meta">
                {[p.category, p.city].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span className="pick-row__go" aria-hidden>
              ›
            </span>
          </button>
        ))}
        {places.data && matches.length === 0 && (
          <p className="muted">No places match “{query}”.</p>
        )}
      </div>
    </Modal>
  );
}
