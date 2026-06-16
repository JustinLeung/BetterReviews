import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

/**
 * Self-contained save toggle. Optimistically updates and calls the API.
 * `stopPropagation` so it can live inside a clickable place card.
 */
export function SaveButton({
  placeId,
  saved: initialSaved,
  onChange,
}: {
  placeId: string;
  saved: boolean;
  onChange?: (saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(initialSaved), [initialSaved]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    try {
      if (next) await api.savePlace(placeId);
      else await api.unsavePlace(placeId);
      setSaved(next);
      onChange?.(next);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not update saved places.';
      // eslint-disable-next-line no-alert
      alert(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`save-btn ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  );
}
