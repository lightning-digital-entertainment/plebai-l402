import { Request, Response, Router } from 'express';

const emojis = Router();


emojis.get('/', (req: Request, res: Response) => {
  res.json(['😀', '😳', '🙄']);
});

export default emojis;
