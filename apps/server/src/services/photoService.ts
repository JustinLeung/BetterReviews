import { type CreatePhotoInput, type Photo } from '@betterreviews/shared';
import { ApiError } from '../lib/errors';
import { query } from '../db/pool';

/**
 * POST /photos — stores photo metadata for a post (no binary upload yet).
 *
 * The photo's place_id is derived from the post (not trusted from the client),
 * and the post must belong to the uploader. For now the client supplies an
 * image URL or storage path directly.
 *
 * TODO: integrate Supabase Storage — issue a signed upload URL, accept the
 * resulting `storage_path`, and derive a public/`image_url` from it. See
 * lib/supabase.ts.
 */
export async function createPhoto(
  userId: string,
  input: CreatePhotoInput,
): Promise<Photo> {
  const { rows: postRows } = await query<{ place_id: string }>(
    `SELECT place_id FROM posts WHERE id = $1 AND user_id = $2`,
    [input.postId, userId],
  );
  if (postRows.length === 0) {
    throw ApiError.notFound('Post not found');
  }

  const { rows } = await query<Photo>(
    `
    INSERT INTO photos
      (user_id, place_id, post_id, image_url, storage_path, caption, position)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      userId,
      postRows[0].place_id,
      input.postId,
      input.imageUrl ?? null,
      input.storagePath ?? null,
      input.caption ?? null,
      input.position ?? 0,
    ],
  );
  return rows[0];
}
