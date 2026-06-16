import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlaceWithSummary } from '@betterreviews/shared';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { categoriesOf, matchBand, scoreClass, scoreText } from '../lib/match';
import { SaveButton } from '../components/SaveButton';
import { SignalRow } from '../components/SignalRow';

const ALL = 'Best for me';

/** Map-first discovery (the spatial interaction model): a sidebar list of
 *  places beside a map whose pins are colored by your match score and placed
 *  from each place's real coordinates. */
export function MapPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: places, loading, error, reload } = useAsync(() => api.listPlaces(), []);

  const located = useMemo(
    () => (places ?? []).filter((p) => p.latitude != null && p.longitude != null),
    [places],
  );

  const positions = useMemo(() => layoutPins(located), [located]);

  const ranked = useMemo(
    () =>
      [...located].sort(
        (a, b) => (b.matchScore.matchScore ?? -1) - (a.matchScore.matchScore ?? -1),
      ),
    [located],
  );

  const categories = useMemo(() => [ALL, ...categoriesOf(located)], [located]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter(
      (p) =>
        (category === ALL || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [ranked, query, category]);

  const selected = located.find((p) => p.id === selectedId) ?? visible[0] ?? ranked[0] ?? null;

  return (
    <div className="map-layout">
      <aside className="map-aside">
        <div className="map-aside__head">
          <div className="map-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Search this area"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="map-filters">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${c === category ? 'on' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="map-aside__count">
          {visible.length} {visible.length === 1 ? 'place' : 'places'} · best for you first
        </div>

        <div className="map-aside__list">
          {loading && <p className="loading-note">Loading…</p>}
          {error && (
            <p className="form-error">
              {error}{' '}
              <button className="btn btn--ghost" onClick={reload}>
                Retry
              </button>
            </p>
          )}
          {visible.map((p) => (
            <button
              key={p.id}
              className={`map-row ${selected?.id === p.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="map-row__thumb">
                {p.coverPhotoUrl ? <img src={p.coverPhotoUrl} alt={p.name} /> : '🍽️'}
              </div>
              <div>
                <div className="map-row__name">{p.name}</div>
                <div className="map-row__meta">
                  {[p.category, p.city].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className={`map-row__score ${scoreClass(p.matchScore.matchScore)}`}>
                {scoreText(p.matchScore)}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="map-stage">
        <div className="map-canvas">
          <StreetBackdrop />
        </div>

        {/* "You are here" — roughly the centre of the cluster */}
        <div className="map-me" style={{ left: '50%', top: '54%' }} />

        {visible.map((p) => {
          const pos = positions[p.id];
          if (!pos) return null;
          const band = matchBand(p.matchScore.matchScore);
          const isSel = selected?.id === p.id;
          return (
            <button
              key={p.id}
              className={`map-pin map-pin--${band} ${isSel ? 'is-selected' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => setSelectedId(p.id)}
              aria-label={`${p.name} — ${scoreText(p.matchScore)} match`}
            >
              <span className="map-pin__bub">{scoreText(p.matchScore)}</span>
            </button>
          );
        })}

        {selected && (
          <div className="map-card" key={selected.id}>
            <div className="map-card__top">
              <div className="map-card__thumb">
                {selected.coverPhotoUrl ? (
                  <img src={selected.coverPhotoUrl} alt={selected.name} />
                ) : (
                  '🍽️'
                )}
              </div>
              <div>
                <div className="map-card__name">{selected.name}</div>
                <div className="map-card__meta">
                  {[selected.category, selected.city].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="map-card__match">
                <div className={`pct ${scoreClass(selected.matchScore.matchScore)}`}>
                  {scoreText(selected.matchScore)}
                </div>
                <div className="lab">match</div>
              </div>
            </div>
            <p className="whyline">{selected.matchScore.label}.</p>
            <SignalRow place={selected} />
            <div className="map-card__cta">
              <SaveButton placeId={selected.id} saved={selected.saved} />
              <button className="btn btn--primary" onClick={() => navigate(`/places/${selected.id}`)}>
                View details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Pt {
  x: number;
  y: number;
}

/**
 * Project each place from lat/long into the map area, then nudge overlapping
 * pins apart so tightly-clustered venues stay legible — a lightweight stand-in
 * for real marker clustering.
 */
function layoutPins(places: PlaceWithSummary[]): Record<string, Pt> {
  if (places.length === 0) return {};
  const lats = places.map((p) => p.latitude as number);
  const lngs = places.map((p) => p.longitude as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const xMin = 12;
  const xMax = 88;
  const yMin = 14;
  const yMax = 84;
  const span = (lo: number, hi: number) => hi - lo || 1;

  const MIN_GAP = 9; // %; pins closer than this get spread out
  const placed: Pt[] = [];
  const out: Record<string, Pt> = {};

  for (const p of places) {
    const baseX = xMin + ((p.longitude! - minLng) / span(minLng, maxLng)) * (xMax - xMin);
    const baseY = yMin + ((maxLat - p.latitude!) / span(minLat, maxLat)) * (yMax - yMin);
    let pt: Pt = { x: baseX, y: baseY };
    let tries = 0;
    while (placed.some((q) => Math.hypot(q.x - pt.x, q.y - pt.y) < MIN_GAP) && tries < 16) {
      const angle = tries * 2.39996; // golden-angle spiral
      const radius = MIN_GAP * (1 + tries * 0.12);
      pt = {
        x: clamp(baseX + Math.cos(angle) * radius, xMin, xMax),
        y: clamp(baseY + Math.sin(angle) * radius, yMin, yMax),
      };
      tries++;
    }
    placed.push(pt);
    out[p.id] = pt;
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Stylised street grid + river backdrop (purely decorative). */
function StreetBackdrop() {
  return (
    <svg viewBox="0 0 900 620" preserveAspectRatio="xMidYMid slice">
      <path
        d="M620 -20 C 560 140, 760 280, 580 440 C 480 540, 600 640, 540 700"
        stroke="#b9d4e6"
        strokeWidth="34"
        fill="none"
        opacity=".8"
      />
      <g stroke="#dcd2c0" strokeWidth="8" fill="none" opacity=".9">
        <path d="M-10 130 H920" />
        <path d="M-10 320 H920" />
        <path d="M-10 500 H920" />
        <path d="M160 -10 V630" />
        <path d="M360 -10 V630" />
        <path d="M560 -10 V630" />
        <path d="M760 -10 V630" />
        <path d="M-10 70 L 420 320 L 920 580" />
      </g>
      <g fill="#e2e9df" opacity=".7">
        <rect x="40" y="150" width="90" height="60" rx="7" />
        <rect x="210" y="160" width="110" height="50" rx="7" />
        <rect x="410" y="350" width="110" height="65" rx="7" />
        <rect x="80" y="360" width="70" height="70" rx="7" />
        <rect x="240" y="530" width="100" height="55" rx="7" />
        <rect x="640" y="180" width="80" height="60" rx="7" />
        <rect x="800" y="370" width="80" height="70" rx="7" />
      </g>
    </svg>
  );
}
