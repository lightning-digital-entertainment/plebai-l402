// tslint:disable-next-line:no-console
import { Request, Response, Router } from 'express';
import emojis from './emojis';
import l402 from './l402';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/l402', l402);

export default router;