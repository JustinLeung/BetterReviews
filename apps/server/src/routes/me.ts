import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireUser } from '../middleware/auth';
import { listSavedPlaces } from '../services/placeService';

export const meRouter = Router();

/** GET /me/saves — the current user's saved places. */
meRouter.get(
  '/saves',
  requireUser,
  asyncHandler(async (req, res) => {
    const places = await listSavedPlaces(req.userId as string);
    res.json({ places });
  }),
);
