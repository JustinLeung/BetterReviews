import type { Photo } from '@betterreviews/shared';

/** Responsive grid of place photos. */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const withImages = photos.filter((p) => p.image_url);
  if (withImages.length === 0) {
    return <p className="muted">No photos yet — be the first to add one.</p>;
  }
  return (
    <div className="photo-grid">
      {withImages.map((photo) => (
        <figure key={photo.id} className="photo-grid__item">
          <img src={photo.image_url as string} alt={photo.caption ?? ''} loading="lazy" />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
