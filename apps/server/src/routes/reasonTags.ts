import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { listReasonTags } from '../services/reasonTagService';

export const reasonTagsRouter = Router();

/** GET /reason-tags */
reasonTagsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const reasonTags = await listReasonTags();
    res.json({ reasonTags });
  }),
);
