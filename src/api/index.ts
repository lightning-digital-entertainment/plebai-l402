// tslint:disable-next-line:no-console
import { Request, Response, Router } from 'express';
import chat from './chat';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/chat', chat);

export default router;