import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import { requireUser } from '../middleware/auth';
import { createPhoto } from '../services/photoService';

const createPhotoSchema = z
  .object({
    placeId: z.string().uuid(),
    recommendationId: z.string().uuid().nullish(),
    imageUrl: z.string().url().nullish(),
    storagePath: z.string().trim().min(1).nullish(),
    caption: z.string().trim().max(500).nullish(),
  })
  .refine((d) => Boolean(d.imageUrl || d.storagePath), {
    message: 'Provide either imageUrl or storagePath.',
    path: ['imageUrl'],
  });

export const photosRouter = Router();

/** POST /photos — stores photo metadata (no binary upload yet). */
photosRouter.post(
  '/',
  requireUser,
  validateBody(createPhotoSchema),
  asyncHandler(async (req, res) => {
    const photo = await createPhoto(req.userId as string, req.body);
    res.status(201).json({ photo });
  }),
);
