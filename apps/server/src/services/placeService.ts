import {
  calculateMatchScore,
  type CreatePlaceInput,
  type Photo,
  type Place,
  type PlaceDetail,
  type PlaceWithSummary,
  type ReasonTagSummaryItem,
} from '@betterreviews/shared';
import { query } from '../db/pool';

/**
 * SELECT fragment that enriches a `places` row with aggregate recommendation
 * counts, a cover photo, and whether the given user has saved it.
 *
 * Parameter placeholder for the user id is supplied by callers; see usages.
 */
function enrichedPlaceColumns(userParam: string): string {
  return `
    p.*,
    count(r.id) FILTER (WHERE r.recommendation_value = 'yes')   AS yes_count,
    count(r.id) FILTER (WHERE r.recommendation_value = 'maybe') AS maybe_count,
    count(r.id) FILTER (WHERE r.recommendation_value = 'no')    AS no_count,
    (
      SELECT ph.image_url FROM photos ph
      WHERE ph.place_id = p.id AND ph.image_url IS NOT NULL
      ORDER BY ph.created_at DESC LIMIT 1
    ) AS cover_photo_url,
    CASE WHEN ${userParam}::uuid IS NULL THEN false
         ELSE EXISTS (
           SELECT 1 FROM saves s WHERE s.place_id = p.id AND s.user_id = ${userParam}::uuid
         )
    END AS saved
  `;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToPlaceWithSummary(row: any): PlaceWithSummary {
  const yes = Number(row.yes_count ?? 0);
  const maybe = Number(row.maybe_count ?? 0);
  const no = Number(row.no_count ?? 0);
  const recommendationSummary = { yes, maybe, no, total: yes + maybe + no };

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    external_google_place_id: row.external_google_place_id,
    external_source: row.external_source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    recommendationSummary,
    matchScore: calculateMatchScore(recommendationSummary),
    coverPhotoUrl: row.cover_photo_url ?? null,
    saved: Boolean(row.saved),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface PlaceFilters {
  city?: string;
  category?: string;
  search?: string;
}

/** GET /places — discover list with lightweight aggregate signal. */
export async function listPlaces(
  filters: PlaceFilters,
  userId: string | null,
): Promise<PlaceWithSummary[]> {
  const { rows } = await query(
    `
    SELECT ${enrichedPlaceColumns('$4')}
    FROM places p
    LEFT JOIN recommendations r ON r.place_id = p.id
    WHERE ($1::text IS NULL OR p.city ILIKE $1)
      AND ($2::text IS NULL OR p.category ILIKE $2)
      AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%' OR p.address ILIKE '%' || $3 || '%')
    GROUP BY p.id
    ORDER BY p.created_at DESC
    `,
    [filters.city ?? null, filters.category ?? null, filters.search ?? null, userId],
  );
  return rows.map(rowToPlaceWithSummary);
}

/** GET /places/:id — full detail with photos and reason-tag breakdown. */
export async function getPlaceDetail(
  id: string,
  userId: string | null,
): Promise<PlaceDetail | null> {
  const { rows } = await query(
    `
    SELECT ${enrichedPlaceColumns('$2')}
    FROM places p
    LEFT JOIN recommendations r ON r.place_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
    `,
    [id, userId],
  );
  if (rows.length === 0) return null;
  const base = rowToPlaceWithSummary(rows[0]);

  const [{ rows: photoRows }, { rows: tagRows }] = await Promise.all([
    query<Photo>(
      `SELECT * FROM photos WHERE place_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
    query<ReasonTagSummaryItem>(
      `
      SELECT rt.id, rt.label, rt.sentiment, count(*)::int AS count
      FROM recommendation_reason_tags rrt
      JOIN reason_tags rt ON rt.id = rrt.reason_tag_id
      JOIN recommendations r ON r.id = rrt.recommendation_id
      WHERE r.place_id = $1
      GROUP BY rt.id, rt.label, rt.sentiment
      ORDER BY count DESC, rt.label ASC
      `,
      [id],
    ),
  ]);

  return { ...base, photos: photoRows, reasonTagSummary: tagRows };
}

/** POST /places */
export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const { rows } = await query<Place>(
    `
    INSERT INTO places
      (name, category, address, city, country, latitude, longitude,
       external_google_place_id, external_source)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      input.name,
      input.category ?? null,
      input.address ?? null,
      input.city ?? null,
      input.country ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.externalGooglePlaceId ?? null,
      input.externalSource ?? null,
    ],
  );
  return rows[0];
}

/** GET /me/saves — places the user has saved, with the same enrichment. */
export async function listSavedPlaces(userId: string): Promise<PlaceWithSummary[]> {
  const { rows } = await query(
    `
    SELECT ${enrichedPlaceColumns('$1')}
    FROM places p
    JOIN saves sv ON sv.place_id = p.id AND sv.user_id = $1::uuid
    LEFT JOIN recommendations r ON r.place_id = p.id
    GROUP BY p.id, sv.created_at
    ORDER BY sv.created_at DESC
    `,
    [userId],
  );
  return rows.map(rowToPlaceWithSummary);
}

/** Whether a place exists. */
export async function placeExists(id: string): Promise<boolean> {
  const { rowCount } = await query(`SELECT 1 FROM places WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}
