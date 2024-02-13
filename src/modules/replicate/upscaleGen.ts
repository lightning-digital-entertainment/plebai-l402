import Replicate from "replicate";
import { generateRandom5DigitNumber, getCurrentUrl, getGifUrl } from "../helpers";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

export async function upscaleGen (genModel:any, scale:number, inputImage:string, outputType:string):Promise<string> {

    const output:any = await replicate.run(
        genModel,
        {
          input: {

            image_url:inputImage,
            scale
          }
        }
    );

    if (output) {
        console.log('From video gen: ', output)
        const id = uuidv4();
        return await getCurrentUrl(output, 'image/plebai/upscale/', id, 'png');

    } else {

        return null;
    }



}