import { Request, Response, Router } from 'express';
import { SystemPurposes } from '../modules/data';


const data = Router();



data.post('/agents', async (req: Request, res: Response) => {

        console.log(req.body);

        res.send({SystemPurposes})



});

export default data;