import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlaceWithSummary } from '@betterreviews/shared';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { categoriesOf, scoreClass, scoreText } from '../lib/match';
import { SignalRow } from '../components/SignalRow';

const ALL = 'For you';

/** Discover — a curated "For You" feed (the browse interaction model). */
export function FeedPage() {
  const [category, setCategory] = useState(ALL);
  const { data: places, loading, error, reload } = useAsync(() => api.listPlaces(), []);

  const filters = useMemo(() => [ALL, ...categoriesOf(places ?? [])], [places]);

  const { hero, twins, gems } = useMemo(() => {
    const scoped =
      category === ALL ? (places ?? []) : (places ?? []).filter((p) => p.category === category);
    return split(scoped);
  }, [places, category]);

  return (
    <div className="feed">
      <div className="greet">
        <div>
          <p className="greet__eyebrow">{dayLabel()} · Munich</p>
          <h1 className="greet__title">{greeting()}</h1>
        </div>
        <div className="greet__avatar">🧔</div>
      </div>

      <div className="mood-row">
        {filters.map((c) => (
          <button
            key={c}
            className={`chip ${c === category ? 'on' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="loading-note">Finding places tuned to your taste…</p>}
      {error && (
        <p className="form-error">
          {error}{' '}
          <button className="btn btn--ghost" onClick={reload}>
            Retry
          </button>
        </p>
      )}

      {hero && (
        <>
          <div className="feed-main">
            <section>
              <div className="feed-section__head">
                <span className="feed-section__title">Top match today</span>
              </div>
              <HeroCard place={hero} />
            </section>

            {twins.length > 0 && (
              <aside className="rail">
                <div className="feed-section__head">
                  <span className="feed-section__title">Taste-twins loved</span>
                  <Link to="/list" className="feed-section__link">
                    See all
                  </Link>
                </div>
                <div className="twin-rail">
                  {twins.map((p) => (
                    <TwinItem key={p.id} place={p} />
                  ))}
                </div>
              </aside>
            )}
          </div>

          {gems.length > 0 && (
            <section className="feed-gems">
              <div className="feed-section__head">
                <span className="feed-section__title">More gems for your palate</span>
                <Link to="/map" className="feed-section__link">
                  On map
                </Link>
              </div>
              <div className="gem-grid">
                {gems.map((p) => (
                  <GemRow key={p.id} place={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {places && places.length === 0 && !loading && (
        <div className="empty-state">
          <p>No places yet — be the first to recommend one.</p>
        </div>
      )}
    </div>
  );
}

/** Split the list into a hero, a taste-twin rail, and a gem grid. */
function split(places: PlaceWithSummary[]) {
  const ranked = [...places].sort(
    (a, b) => (b.matchScore.matchScore ?? -1) - (a.matchScore.matchScore ?? -1),
  );
  return {
    hero: ranked[0] ?? null,
    twins: ranked.slice(1, 4),
    gems: ranked.slice(4),
  };
}

function HeroCard({ place }: { place: PlaceWithSummary }) {
  const score = place.matchScore.matchScore;
  const isGem = score != null && score >= 75;
  const meta = [place.category, place.city].filter(Boolean).join(' · ');
  return (
    <Link to={`/places/${place.id}`} className="topmatch">
      <div className="topmatch__media">
        {place.coverPhotoUrl ? <img src={place.coverPhotoUrl} alt={place.name} /> : '🍽️'}
        {isGem && <span className="topmatch__gem">💎 Hidden gem</span>}
        <div className="topmatch__score">
          <div className="p">{scoreText(place.matchScore)}</div>
          <div className="l">your match</div>
        </div>
      </div>
      <div className="topmatch__body">
        <h3 className="topmatch__name">{place.name}</h3>
        {meta && <p className="topmatch__meta">{meta}</p>}
        <p className="whyline">{place.matchScore.label}.</p>
        <SignalRow place={place} />
      </div>
    </Link>
  );
}

function TwinItem({ place }: { place: PlaceWithSummary }) {
  const liked = Math.max(2, place.recommendationSummary.yes);
  return (
    <Link to={`/places/${place.id}`} className="twin-rail__item">
      <div className="twin-rail__thumb">
        {place.coverPhotoUrl ? <img src={place.coverPhotoUrl} alt={place.name} /> : '🍴'}
      </div>
      <div>
        <div className="twin-rail__name">{place.name}</div>
        <div className="twin-rail__who">
          ♥ liked by <b>{liked} twins</b>
        </div>
      </div>
    </Link>
  );
}

function GemRow({ place }: { place: PlaceWithSummary }) {
  const meta = [place.category, place.city].filter(Boolean).join(' · ');
  return (
    <Link to={`/places/${place.id}`} className="gem-row">
      <div className="gem-row__thumb">
        {place.coverPhotoUrl ? <img src={place.coverPhotoUrl} alt={place.name} /> : '🍲'}
      </div>
      <div>
        <div className="gem-row__name">{place.name}</div>
        {meta && <div className="gem-row__meta">{meta}</div>}
      </div>
      <div className={`gem-row__score ${scoreClass(place.matchScore.matchScore)}`}>
        {scoreText(place.matchScore)}
      </div>
    </Link>
  );
}

function dayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen, Jonas';
  if (h < 18) return 'Servus, Jonas';
  return 'Guten Abend, Jonas';
}
