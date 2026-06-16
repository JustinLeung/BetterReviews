import { type ReasonTag } from '@betterreviews/shared';
import { query } from '../db/pool';

/** GET /reason-tags — predefined clickable reasons, grouped by sentiment. */
export async function listReasonTags(): Promise<ReasonTag[]> {
  const { rows } = await query<ReasonTag>(
    `
    SELECT id, label, sentiment
    FROM reason_tags
    ORDER BY
      CASE sentiment WHEN 'positive' THEN 0 WHEN 'neutral' THEN 1 ELSE 2 END,
      label ASC
    `,
  );
  return rows;
}
