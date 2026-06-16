import { Router } from 'express';
import { z } from 'zod';
import { RECOMMENDATION_VALUES, VISIBILITIES } from '@betterreviews/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import { requireUser } from '../middleware/auth';
import { createPost } from '../services/postService';

const createPostSchema = z.object({
  placeId: z.string().uuid(),
  recommendationValue: z.enum(RECOMMENDATION_VALUES),
  visibility: z.enum(VISIBILITIES).optional(),
  note: z.string().trim().max(1000).nullish(),
  visitedAt: z.string().date().nullish(), // YYYY-MM-DD
  reasonTagIds: z.array(z.string().uuid()).max(12).optional(),
});

export const postsRouter = Router();

/** POST /posts — create a per-visit post for a place. */
postsRouter.post(
  '/',
  requireUser,
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    const post = await createPost(req.userId as string, req.body);
    res.status(201).json({ post });
  }),
);
