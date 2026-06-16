import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { ApiError } from '../lib/errors';
import { validateBody, validateQuery } from '../middleware/validate';
import { requireUser } from '../middleware/auth';
import * as placeService from '../services/placeService';
import { listPostsForPlace } from '../services/postService';
import { savePlace, unsavePlace } from '../services/saveService';

const placesQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

const createPlaceSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  externalGooglePlaceId: z.string().trim().min(1).optional(),
  externalSource: z.string().trim().min(1).optional(),
});

export const placesRouter = Router();

/** GET /places?city=&category=&search= */
placesRouter.get(
  '/',
  validateQuery(placesQuerySchema),
  asyncHandler(async (req, res) => {
    const places = await placeService.listPlaces(res.locals.query, req.userId);
    res.json({ places });
  }),
);

/** POST /places */
placesRouter.post(
  '/',
  validateBody(createPlaceSchema),
  asyncHandler(async (req, res) => {
    const place = await placeService.createPlace(req.body);
    res.status(201).json({ place });
  }),
);

/** GET /places/:id */
placesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const place = await placeService.getPlaceDetail(req.params.id, req.userId);
    if (!place) throw ApiError.notFound('Place not found');
    res.json({ place });
  }),
);

/** GET /places/:id/posts */
placesRouter.get(
  '/:id/posts',
  asyncHandler(async (req, res) => {
    const posts = await listPostsForPlace(req.params.id, req.userId);
    res.json({ posts });
  }),
);

/** POST /places/:id/save */
placesRouter.post(
  '/:id/save',
  requireUser,
  asyncHandler(async (req, res) => {
    const save = await savePlace(req.userId as string, req.params.id);
    res.status(201).json({ save });
  }),
);

/** DELETE /places/:id/save */
placesRouter.delete(
  '/:id/save',
  requireUser,
  asyncHandler(async (req, res) => {
    await unsavePlace(req.userId as string, req.params.id);
    res.status(204).send();
  }),
);
