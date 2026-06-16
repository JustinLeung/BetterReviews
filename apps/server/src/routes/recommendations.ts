import { Router } from 'express';
import { z } from 'zod';
import { RECOMMENDATION_VALUES, VISIBILITIES } from '@betterreviews/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import { requireUser } from '../middleware/auth';
import { upsertRecommendation } from '../services/recommendationService';

const createRecommendationSchema = z.object({
  placeId: z.string().uuid(),
  recommendationValue: z.enum(RECOMMENDATION_VALUES),
  visibility: z.enum(VISIBILITIES).optional(),
  reasonTagIds: z.array(z.string().uuid()).max(12).optional(),
});

export const recommendationsRouter = Router();

/** POST /recommendations */
recommendationsRouter.post(
  '/',
  requireUser,
  validateBody(createRecommendationSchema),
  asyncHandler(async (req, res) => {
    const recommendation = await upsertRecommendation(req.userId as string, req.body);
    res.status(201).json({ recommendation });
  }),
);
