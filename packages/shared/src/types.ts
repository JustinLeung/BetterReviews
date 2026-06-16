import { RECOMMENDATION_VALUES, VISIBILITIES, REASON_SENTIMENTS } from './constants';

/** Whether a user would recommend a place to a friend. The core signal. */
export type RecommendationValue = (typeof RECOMMENDATION_VALUES)[number];

/** Who can see a recommendation. Friend-graph filtering comes later. */
export type Visibility = (typeof VISIBILITIES)[number];

/** Sentiment bucket for a predefined reason tag. */
export type ReasonSentiment = (typeof REASON_SENTIMENTS)[number];

// ---------------------------------------------------------------------------
// Core entities. Field names mirror the database columns (snake_case) so rows
// can be returned to the client without a translation layer for now.
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  external_google_place_id: string | null;
  external_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  place_id: string;
  recommendation_value: RecommendationValue;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  place_id: string;
  recommendation_id: string | null;
  image_url: string | null;
  storage_path: string | null;
  caption: string | null;
  created_at: string;
}

export interface ReasonTag {
  id: string;
  label: string;
  sentiment: ReasonSentiment;
}

export interface RecommendationReasonTag {
  recommendation_id: string;
  reason_tag_id: string;
}

export interface Follow {
  follower_user_id: string;
  followed_user_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  user_id: string;
  place_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Aggregate / response shapes used by the API.
// ---------------------------------------------------------------------------

/** Raw counts of the lightweight recommendation signal for a place. */
export interface RecommendationSummary {
  yes: number;
  maybe: number;
  no: number;
  total: number;
}

/**
 * The placeholder personalized "match score". v0 is a simple aggregate; later
 * versions personalize per user. See `calculateMatchScore`.
 */
export interface MatchScore {
  /** 0–100, or null when there is not enough signal yet. */
  matchScore: number | null;
  label: string;
  sampleSize: number;
}

/** A reason tag plus how many recommendations selected it for a place. */
export interface ReasonTagSummaryItem extends ReasonTag {
  count: number;
}

/** Place as returned in list/discover views. */
export interface PlaceWithSummary extends Place {
  recommendationSummary: RecommendationSummary;
  matchScore: MatchScore;
  coverPhotoUrl: string | null;
  /** Whether the current (mock) user has saved this place. */
  saved: boolean;
}

/** Place detail view, with photos and the reasons people selected. */
export interface PlaceDetail extends PlaceWithSummary {
  photos: Photo[];
  reasonTagSummary: ReasonTagSummaryItem[];
}

/** A recommendation enriched with its author, reason tags and photos. */
export interface RecommendationWithDetails extends Recommendation {
  user: Pick<User, 'id' | 'display_name' | 'username' | 'avatar_url'>;
  reasonTags: ReasonTag[];
  photos: Photo[];
}

// ---------------------------------------------------------------------------
// Request bodies (camelCase, as sent by the client).
// ---------------------------------------------------------------------------

export interface CreatePlaceInput {
  name: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  externalGooglePlaceId?: string | null;
  externalSource?: string | null;
}

export interface CreateRecommendationInput {
  placeId: string;
  recommendationValue: RecommendationValue;
  visibility?: Visibility;
  reasonTagIds?: string[];
}

export interface CreatePhotoInput {
  placeId: string;
  recommendationId?: string | null;
  imageUrl?: string | null;
  storagePath?: string | null;
  caption?: string | null;
}
