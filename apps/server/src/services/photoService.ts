import { type CreatePhotoInput, type Photo } from '@betterreviews/shared';
import { query } from '../db/pool';

/**
 * POST /photos — stores photo metadata only.
 *
 * For now the client supplies an image URL or a storage path directly. We do
 * not handle the binary upload here.
 *
 * TODO: integrate Supabase Storage — issue a signed upload URL, accept the
 * resulting `storage_path`, and derive a public/`image_url` from it. See
 * lib/supabase.ts.
 */
export async function createPhoto(
  userId: string,
  input: CreatePhotoInput,
): Promise<Photo> {
  const { rows } = await query<Photo>(
    `
    INSERT INTO photos
      (user_id, place_id, recommendation_id, image_url, storage_path, caption)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      userId,
      input.placeId,
      input.recommendationId ?? null,
      input.imageUrl ?? null,
      input.storagePath ?? null,
      input.caption ?? null,
    ],
  );
  return rows[0];
}
