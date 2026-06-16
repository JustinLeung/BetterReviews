import {
  type CreateRecommendationInput,
  type Photo,
  type Recommendation,
  type RecommendationWithDetails,
  type ReasonTag,
} from '@betterreviews/shared';
import { query, withTransaction } from '../db/pool';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /places/:id/recommendations
 *
 * Returns recommendations for a place, each enriched with its author, reason
 * tags and photos. Visibility is kept simple for now: private recommendations
 * are hidden unless they belong to the requesting user.
 *
 * TODO: once the friend graph exists, `friends`-visibility recommendations
 * should be filtered to the requester's follow graph.
 */
export async function listRecommendationsForPlace(
  placeId: string,
  currentUserId: string | null,
): Promise<RecommendationWithDetails[]> {
  const { rows } = await query<any>(
    `
    SELECT
      r.*,
      u.id AS author_id, u.display_name, u.username, u.avatar_url
    FROM recommendations r
    JOIN users u ON u.id = r.user_id
    WHERE r.place_id = $1
      AND (r.visibility <> 'private' OR r.user_id = $2::uuid)
    ORDER BY r.created_at DESC
    `,
    [placeId, currentUserId],
  );

  if (rows.length === 0) return [];

  const recIds = rows.map((r) => r.id);
  const [{ rows: tagRows }, { rows: photoRows }] = await Promise.all([
    query<any>(
      `
      SELECT rrt.recommendation_id, rt.id, rt.label, rt.sentiment
      FROM recommendation_reason_tags rrt
      JOIN reason_tags rt ON rt.id = rrt.reason_tag_id
      WHERE rrt.recommendation_id = ANY($1::uuid[])
      ORDER BY rt.label ASC
      `,
      [recIds],
    ),
    query<Photo>(
      `SELECT * FROM photos WHERE recommendation_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
      [recIds],
    ),
  ]);

  const tagsByRec = new Map<string, ReasonTag[]>();
  for (const t of tagRows) {
    const list = tagsByRec.get(t.recommendation_id) ?? [];
    list.push({ id: t.id, label: t.label, sentiment: t.sentiment });
    tagsByRec.set(t.recommendation_id, list);
  }

  const photosByRec = new Map<string, Photo[]>();
  for (const p of photoRows) {
    if (!p.recommendation_id) continue;
    const list = photosByRec.get(p.recommendation_id) ?? [];
    list.push(p);
    photosByRec.set(p.recommendation_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    place_id: r.place_id,
    recommendation_value: r.recommendation_value,
    visibility: r.visibility,
    created_at: r.created_at,
    updated_at: r.updated_at,
    user: {
      id: r.author_id,
      display_name: r.display_name,
      username: r.username,
      avatar_url: r.avatar_url,
    },
    reasonTags: tagsByRec.get(r.id) ?? [],
    photos: photosByRec.get(r.id) ?? [],
  }));
}

/**
 * POST /recommendations
 *
 * Upserts the user's recommendation for a place (one per user per place) and
 * replaces its reason tags. Wrapped in a transaction.
 */
export async function upsertRecommendation(
  userId: string,
  input: CreateRecommendationInput,
): Promise<RecommendationWithDetails> {
  const recommendation = await withTransaction(async (client) => {
    const { rows } = await client.query<Recommendation>(
      `
      INSERT INTO recommendations (user_id, place_id, recommendation_value, visibility)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, place_id) DO UPDATE
        SET recommendation_value = EXCLUDED.recommendation_value,
            visibility           = EXCLUDED.visibility,
            updated_at           = now()
      RETURNING *
      `,
      [userId, input.placeId, input.recommendationValue, input.visibility ?? 'friends'],
    );
    const rec = rows[0];

    // Replace reason tags.
    await client.query(
      `DELETE FROM recommendation_reason_tags WHERE recommendation_id = $1`,
      [rec.id],
    );
    const tagIds = dedupe(input.reasonTagIds ?? []);
    if (tagIds.length > 0) {
      await client.query(
        `
        INSERT INTO recommendation_reason_tags (recommendation_id, reason_tag_id)
        SELECT $1, unnest($2::uuid[])
        ON CONFLICT DO NOTHING
        `,
        [rec.id, tagIds],
      );
    }
    return rec;
  });

  // Re-read with details for a consistent response shape.
  const [{ rows: tagRows }, { rows: photoRows }] = await Promise.all([
    query<ReasonTag>(
      `
      SELECT rt.id, rt.label, rt.sentiment
      FROM recommendation_reason_tags rrt
      JOIN reason_tags rt ON rt.id = rrt.reason_tag_id
      WHERE rrt.recommendation_id = $1
      ORDER BY rt.label ASC
      `,
      [recommendation.id],
    ),
    query<Photo>(
      `SELECT * FROM photos WHERE recommendation_id = $1 ORDER BY created_at DESC`,
      [recommendation.id],
    ),
  ]);
  const { rows: userRows } = await query<any>(
    `SELECT id, display_name, username, avatar_url FROM users WHERE id = $1`,
    [userId],
  );

  return {
    ...recommendation,
    user: userRows[0],
    reasonTags: tagRows,
    photos: photoRows,
  };
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
