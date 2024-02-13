import Replicate from "replicate";
import { generateRandom5DigitNumber, getCurrentUrl, getGifUrl } from "../helpers";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

export async function videoGen (videoModel:any, inputImage:string, outputType:string):Promise<string> {

    const output:any = await replicate.run(
        videoModel,
        {
          input: {
            cond_aug: 0.02,
            decoding_t: 7,
            input_image:inputImage ,
            video_length: "14_frames_with_svd",
            sizing_strategy: "maintain_aspect_ratio",
            motion_bucket_id: 127,
            frames_per_second: 6
          }
        }
    );

    if (output) {
        console.log('From video gen: ', output)
        const id = uuidv4();
        if (outputType && outputType==='gif') {
            return await getGifUrl(output, 'video/diffusion/', id, '.mp4');
        } else {
            return await getCurrentUrl(output, 'video/diffusion/', id, '.mp4');
        }

    } else {

        return null;
    }



}