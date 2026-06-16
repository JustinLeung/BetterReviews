import { Router } from 'express';
import { healthRouter } from './health';
import { placesRouter } from './places';
import { recommendationsRouter } from './recommendations';
import { photosRouter } from './photos';
import { reasonTagsRouter } from './reasonTags';
import { meRouter } from './me';

/** Mounts all API routers under the application root. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/places', placesRouter);
apiRouter.use('/recommendations', recommendationsRouter);
apiRouter.use('/photos', photosRouter);
apiRouter.use('/reason-tags', reasonTagsRouter);
apiRouter.use('/me', meRouter);
