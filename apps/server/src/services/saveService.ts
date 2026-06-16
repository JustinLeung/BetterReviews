import { type Save } from '@betterreviews/shared';
import { query } from '../db/pool';

/** POST /places/:id/save — idempotent save. */
export async function savePlace(userId: string, placeId: string): Promise<Save> {
  const { rows } = await query<Save>(
    `
    INSERT INTO saves (user_id, place_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, place_id) DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING *
    `,
    [userId, placeId],
  );
  return rows[0];
}

/** DELETE /places/:id/save — returns true if a save was removed. */
export async function unsavePlace(userId: string, placeId: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM saves WHERE user_id = $1 AND place_id = $2`,
    [userId, placeId],
  );
  return (rowCount ?? 0) > 0;
}
