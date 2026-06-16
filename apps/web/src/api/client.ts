import type {
  CreatePhotoInput,
  CreateRecommendationInput,
  Photo,
  PlaceDetail,
  PlaceWithSummary,
  ReasonTag,
  RecommendationWithDetails,
  Save,
} from '@betterreviews/shared';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const MOCK_USER_ID = import.meta.env.VITE_MOCK_USER_ID ?? '';

/**
 * Auth headers for an API request. In Supabase mode, send the session's access
 * token as a Bearer; otherwise (legacy/no-auth mode) send the mock-user header.
 */
async function authHeaders(): Promise<Record<string, string>> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return MOCK_USER_ID ? { 'x-mock-user-id': MOCK_USER_ID } : {};
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

function queryString(params: object): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export interface PlaceFilters {
  city?: string;
  category?: string;
  search?: string;
}

export const api = {
  listPlaces: (filters: PlaceFilters = {}) =>
    request<{ places: PlaceWithSummary[] }>(`/places${queryString(filters)}`).then(
      (r) => r.places,
    ),

  getPlace: (id: string) =>
    request<{ place: PlaceDetail }>(`/places/${id}`).then((r) => r.place),

  listRecommendations: (placeId: string) =>
    request<{ recommendations: RecommendationWithDetails[] }>(
      `/places/${placeId}/recommendations`,
    ).then((r) => r.recommendations),

  listReasonTags: () =>
    request<{ reasonTags: ReasonTag[] }>('/reason-tags').then((r) => r.reasonTags),

  createRecommendation: (input: CreateRecommendationInput) =>
    request<{ recommendation: RecommendationWithDetails }>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.recommendation),

  createPhoto: (input: CreatePhotoInput) =>
    request<{ photo: Photo }>('/photos', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.photo),

  savePlace: (placeId: string) =>
    request<{ save: Save }>(`/places/${placeId}/save`, { method: 'POST' }).then(
      (r) => r.save,
    ),

  unsavePlace: (placeId: string) =>
    request<void>(`/places/${placeId}/save`, { method: 'DELETE' }),

  listSavedPlaces: () =>
    request<{ places: PlaceWithSummary[] }>('/me/saves').then((r) => r.places),
};
