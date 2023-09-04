import { generateRandom9DigitNumber, getImageUrl } from "../helpers";
import stabledifusion from "./stable-diffusion";
import { writeFileSync} from 'fs'
import { v4 as uuidv4 } from 'uuid';
import { TextToImageRequest } from "./text-to-image";




export async function createGetImage (options: Partial<TextToImageRequest>): Promise<string> {

    try {

        const client = stabledifusion();
        const id = uuidv4()

        const outputFormat = options.output_format?options.output_format:"jpeg";

        const { image } = await client.txt2img({
            prompt: options.prompt ? options.prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
            negative_prompt: options.negative_prompt?options.negative_prompt:'(NSFW, breasts, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, (deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck ',
            width: options.width ? options.width : 512,
            height: options.height ? options.height : 768,
            steps: options.steps?options.steps:20,
            guidance: options.guidance?options.guidance:10,
            seed: options.seed?options.seed:generateRandom9DigitNumber(),
            model: options.model?options.model: "realistic-vision-v3",
            scheduler: options.scheduler?options.scheduler:"euler_a",
            output_format: options.output_format?options.output_format:"jpeg"
        })

       
        if (image) {
            writeFileSync( process.env.UPLOAD_PATH + id + `.` + outputFormat, image, 'base64')
            return await getImageUrl( id, outputFormat)
        } else {

            return null;
        }
        
        
        

    } catch (error) {

        console.log(error);
        return null;

    }


}