
import * as dotenv from 'dotenv';
import { Request, Response, Router } from 'express';
import { createImage } from '../modules/genimage/createImage';

dotenv.config();

const imgGen = Router();

imgGen.post('/generations', async (req: Request, res: Response) => {



        try {

            const response = {
                "created": Date.now,
                "data": [
                  {
                    "url": await createImage(req.body.prompt)
                  }
                ]
              }

            res.setHeader('Content-Type', 'application/json').status(200).send(response);


        } catch (error) {

            res.setHeader('Content-Type', 'application/json').status(200).send({error: 'There is an internal server error. Please try again later'});

        }



})

export default imgGen;



