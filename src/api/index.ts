// tslint:disable-next-line:no-console
import { Request, Response, Router } from 'express';
import emojis from './emojis';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);

export default router;