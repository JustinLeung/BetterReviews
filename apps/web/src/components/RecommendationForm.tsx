import { useState } from 'react';
import {
  RECOMMENDATION_VALUES,
  type RecommendationValue,
  type ReasonTag,
  type Visibility,
} from '@betterreviews/shared';
import { api, ApiError } from '../api/client';
import { ReasonTagPicker } from './ReasonTagPicker';

const VALUE_COPY: Record<RecommendationValue, { label: string; emoji: string }> = {
  yes: { label: 'Yes', emoji: '👍' },
  maybe: { label: 'Maybe', emoji: '🤔' },
  no: { label: 'No', emoji: '👎' },
};

/**
 * The lightweight contribution flow:
 *   photo (optional) → "Would you recommend this to a friend?" → optional reasons.
 * Deliberately no long-form review and no star rating.
 */
export function RecommendationForm({
  placeId,
  placeName,
  reasonTags,
  onSubmitted,
}: {
  placeId: string;
  placeName: string;
  reasonTags: ReasonTag[];
  onSubmitted: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [value, setValue] = useState<RecommendationValue | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      setError('Please pick Yes, Maybe, or No.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const recommendation = await api.createRecommendation({
        placeId,
        recommendationValue: value,
        visibility,
        reasonTagIds: [...selectedTags],
      });

      // Photo upload is metadata-only for now (URL). TODO: Supabase Storage.
      if (photoUrl.trim()) {
        await api.createPhoto({
          placeId,
          recommendationId: recommendation.id,
          imageUrl: photoUrl.trim(),
          caption: caption.trim() || null,
        });
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="rec-form" onSubmit={submit}>
      {/* 1. Photo (optional, photo-first) */}
      <label className="field">
        <span className="field__label">Add a photo (paste a URL)</span>
        <input
          type="url"
          className="field__input"
          placeholder="https://…"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </label>
      {photoUrl.trim() && (
        <>
          <div className="rec-form__preview">
            <img src={photoUrl} alt="Preview" />
          </div>
          <label className="field">
            <span className="field__label">Caption (optional)</span>
            <input
              type="text"
              className="field__input"
              maxLength={140}
              placeholder="What's in the photo?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
        </>
      )}

      {/* 2. The core signal */}
      <fieldset className="field">
        <legend className="field__label">Would you recommend {placeName} to a friend?</legend>
        <div className="value-picker">
          {RECOMMENDATION_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              className={`value-btn value-btn--${v} ${value === v ? 'is-selected' : ''}`}
              aria-pressed={value === v}
              onClick={() => setValue(v)}
            >
              <span className="value-btn__emoji">{VALUE_COPY[v].emoji}</span>
              {VALUE_COPY[v].label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 3. Optional reasons */}
      <div className="field">
        <span className="field__label">Add reasons (optional)</span>
        <ReasonTagPicker reasonTags={reasonTags} selected={selectedTags} onToggle={toggleTag} />
      </div>

      {/* Visibility */}
      <label className="field">
        <span className="field__label">Who can see this?</span>
        <select
          className="field__input"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
        >
          <option value="friends">Friends</option>
          <option value="public">Public</option>
          <option value="private">Only me</option>
        </select>
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Saving…' : 'Share recommendation'}
      </button>
    </form>
  );
}
