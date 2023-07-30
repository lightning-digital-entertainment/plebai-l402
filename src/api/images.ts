
import sdwebui from "../modules/sdwebui"
import { SamplingMethod } from "../modules/types"
import { createReadStream, readFileSync, writeFileSync } from 'fs'
import * as dotenv from 'dotenv';
import { Request, Response, Router } from 'express';
import FormData from 'form-data';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { generateRandom10DigitNumber } from "../modules/helpers";

dotenv.config();

const imgGen = Router();

imgGen.post('/generations', async (req: Request, res: Response) => {

    const client = sdwebui()
    const id = uuidv4()

    try {
      const { images } = await client.txt2img({
        prompt: req.body.prompt?req.body.prompt:'Photo of a classic red mustang car parked in las vegas strip at night',
        negativePrompt: '(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, (Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, ',
        samplingMethod: SamplingMethod.DPMPlusPlus_2M_Karras,
        width: 512,
        height: 512,
        steps: 20,
        batchSize: 1,
        seed: generateRandom10DigitNumber(),
        restoreFaces: true,

      })

      images.forEach((image, i) =>
        writeFileSync( process.env.UPLOAD_PATH + id + `.png`, images[i], 'base64')
      )

      const response = {
        "created": Date.now,
        "data": [
          {
            "url": await getImageUrl('data:image/png;base64,' +images[0], id)
          }
        ]
      }

    res.setHeader('Content-Type', 'application/json').status(200).send(response);
    } catch (err) {
      console.error(err)

      res.setHeader('Content-Type', 'application/json').status(200).send({error: 'There is an internal server error. Please try again later'});
    }




})

async function getImageUrl(imageData: string, id: string): Promise<string> {


    const form = new FormData();
    form.append('asset', createReadStream(process.env.UPLOAD_PATH + id + `.png`));
    form.append("name", 'current/plebai/genimg/' + id + `.png`);
    form.append("type", "image");

    const config = {
        method: 'post',
        url: process.env.UPLOAD_URL,
        headers: {
          'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
          'Content-Type': 'multipart/form-data',
          ...form.getHeaders()
        },
        data: form
    };

    const resp = await axios.request(config);

    return resp.data.data;

}

export default imgGen;



