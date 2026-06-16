import {
  type CreatePostInput,
  type Photo,
  type Post,
  type PostWithDetails,
  type ReasonTag,
} from '@betterreviews/shared';
import { query, withTransaction } from '../db/pool';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /places/:id/posts
 *
 * Returns the timeline of posts for a place (newest first), each enriched with
 * its author, reason tags and photos.
 *
 * Visibility: a post is shown to the viewer when it is public, is their own, or
 * is "friends" and its author follows the viewer. An anonymous viewer (null id)
 * therefore sees only public posts.
 */
export async function listPostsForPlace(
  placeId: string,
  currentUserId: string | null,
): Promise<PostWithDetails[]> {
  const { rows } = await query<any>(
    `
    SELECT
      po.*,
      u.id AS author_id, u.display_name, u.username, u.avatar_url
    FROM posts po
    JOIN users u ON u.id = po.user_id
    WHERE po.place_id = $1
      AND (
        po.visibility = 'public'
        OR po.user_id = $2::uuid
        OR (po.visibility = 'friends' AND EXISTS (
              SELECT 1 FROM follows f
              WHERE f.follower_user_id = po.user_id
                AND f.followed_user_id = $2::uuid))
      )
    ORDER BY po.created_at DESC
    `,
    [placeId, currentUserId],
  );

  if (rows.length === 0) return [];

  const postIds = rows.map((r) => r.id);
  const [{ rows: tagRows }, { rows: photoRows }] = await Promise.all([
    query<any>(
      `
      SELECT prt.post_id, rt.id, rt.label, rt.sentiment
      FROM post_reason_tags prt
      JOIN reason_tags rt ON rt.id = prt.reason_tag_id
      WHERE prt.post_id = ANY($1::uuid[])
      ORDER BY rt.label ASC
      `,
      [postIds],
    ),
    query<Photo>(
      `SELECT * FROM photos WHERE post_id = ANY($1::uuid[]) ORDER BY position ASC, created_at DESC`,
      [postIds],
    ),
  ]);

  const tagsByPost = new Map<string, ReasonTag[]>();
  for (const t of tagRows) {
    const list = tagsByPost.get(t.post_id) ?? [];
    list.push({ id: t.id, label: t.label, sentiment: t.sentiment });
    tagsByPost.set(t.post_id, list);
  }

  const photosByPost = new Map<string, Photo[]>();
  for (const p of photoRows) {
    const list = photosByPost.get(p.post_id) ?? [];
    list.push(p);
    photosByPost.set(p.post_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    place_id: r.place_id,
    recommendation_value: r.recommendation_value,
    visibility: r.visibility,
    note: r.note,
    visited_at: r.visited_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    user: {
      id: r.author_id,
      display_name: r.display_name,
      username: r.username,
      avatar_url: r.avatar_url,
    },
    reasonTags: tagsByPost.get(r.id) ?? [],
    photos: photosByPost.get(r.id) ?? [],
  }));
}

/**
 * POST /posts
 *
 * Creates a new post for a place — per visit, NOT an upsert — and attaches its
 * reason tags. Wrapped in a transaction. Photos are attached separately via
 * POST /photos, so a freshly created post has none yet.
 */
export async function createPost(
  userId: string,
  input: CreatePostInput,
): Promise<PostWithDetails> {
  const post = await withTransaction(async (client) => {
    const { rows } = await client.query<Post>(
      `
      INSERT INTO posts
        (user_id, place_id, recommendation_value, visibility, note, visited_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        userId,
        input.placeId,
        input.recommendationValue,
        input.visibility ?? 'friends',
        input.note ?? null,
        input.visitedAt ?? null,
      ],
    );
    const created = rows[0];

    const tagIds = dedupe(input.reasonTagIds ?? []);
    if (tagIds.length > 0) {
      await client.query(
        `
        INSERT INTO post_reason_tags (post_id, reason_tag_id)
        SELECT $1, unnest($2::uuid[])
        ON CONFLICT DO NOTHING
        `,
        [created.id, tagIds],
      );
    }
    return created;
  });

  // Re-read with details for a consistent response shape.
  const [{ rows: tagRows }, { rows: photoRows }, { rows: userRows }] = await Promise.all([
    query<ReasonTag>(
      `
      SELECT rt.id, rt.label, rt.sentiment
      FROM post_reason_tags prt
      JOIN reason_tags rt ON rt.id = prt.reason_tag_id
      WHERE prt.post_id = $1
      ORDER BY rt.label ASC
      `,
      [post.id],
    ),
    query<Photo>(
      `SELECT * FROM photos WHERE post_id = $1 ORDER BY position ASC, created_at DESC`,
      [post.id],
    ),
    query<any>(
      `SELECT id, display_name, username, avatar_url FROM users WHERE id = $1`,
      [userId],
    ),
  ]);

  return {
    ...post,
    user: userRows[0],
    reasonTags: tagRows,
    photos: photoRows,
  };
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
