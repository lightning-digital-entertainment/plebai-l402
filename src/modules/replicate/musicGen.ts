import Replicate from "replicate";
import { generateRandom5DigitNumber, getCurrentUrl } from "../helpers";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

const musicModel = "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906";

export async function musicGen (prompt:string, duration:number):Promise<string> {

    const output:any = await replicate.run(
        musicModel,
        {
          input: {
            seed: generateRandom5DigitNumber(),
            top_k: 250,
            top_p: 0,
            prompt,
            duration,
            temperature: 1,
            continuation: false,
            model_version: "large",
            output_format: "wav",
            continuation_end: 9,
            continuation_start: 7,
            normalization_strategy: "peak",
            classifier_free_guidance: 3
          }
        }
    );

    if (output) {
        console.log('From music gen: ', output)
        const id = uuidv4();
        return await getCurrentUrl(output, 'music/r1f/', id, '.wav');
    } else {

        return ''
    }



}




