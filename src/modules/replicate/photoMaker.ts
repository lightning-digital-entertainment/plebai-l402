import Replicate from "replicate";
import { generateRandom5DigitNumber, getCurrentUrl, getGifUrl } from "../helpers";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

export async function photoMaker (photoModel:any, inputImage:string, prompt:string):Promise<string> {

    const output:any = await replicate.run(
        photoModel,
        {
            input: {


                prompt,
                width: 640,
                height: 640,
                image: inputImage,
                sdxl_weights: "protovision-xl-high-fidel",
                guidance_scale: 5,
                negative_prompt: "(nsfw, lowres, low quality, worst quality:1.2), (text:1.2), watermark, painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured (lowres, low quality, worst quality:1.2), (text:1.2), watermark, painting, drawing, illustration, glitch,deformed, mutated, cross-eyed, ugly, disfigured",
                ip_adapter_scale: 0.8,
                num_inference_steps: 30,
                controlnet_conditioning_scale: 0.8


            }

        }

    );

    if (output) {
        console.log('From photomaker: ', output)
        const id = uuidv4();
        return await getCurrentUrl(output, 'image/plebai/photo/', id, 'png');

    } else {

        return null;
    }



}