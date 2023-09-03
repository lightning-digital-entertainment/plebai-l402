// tslint:disable-next-line:no-console
import { Request, Response, Router } from 'express';
import chat from './chat';
import images from './images'
import { genPostImage } from '../modules/nostrimage';


const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/chat', chat);
router.use('/images', images);

export default router;