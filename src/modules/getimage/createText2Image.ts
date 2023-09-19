import { generateRandom9DigitNumber, getImageUrl } from "../helpers";
import stabledifusion from "./stable-diffusion";
import { writeFileSync} from 'fs'
import { v4 as uuidv4 } from 'uuid';
import { TextToImageRequest } from "./text-to-image";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ModelIds, closestMultipleOf256, findBestMatch } from '../helpers';

export async function createGetImageWithPrompt(prompt:string): Promise<string> {

    const parser = StructuredOutputParser.fromNamesAndDescriptions({
        prompt: "output prompt enhanced for image generation",
        model: "model name from the list of model name give as input prompt",
        width: "width of the image",
        height: "height of the image",
    });

    const formatInstructions = parser.getFormatInstructions();

    const exampleData = "model name: dark-sushi-mix-v2-25, this model refers dark soul's meme in Chinese community. use this model when the prompt requires animation. model name: absolute-reality-v1-6, use this model when the prompt requires close up portrait of a person. model name: synthwave-punk-v2, use this model when the prompt has keywords such as sythwave, punk style. Here is an example prmopt that uses this model: snthwve style nvinkpunk drunken beautiful woman as delirium from sandman, (hallucinating colorful soap bubbles), by jeremy mann, by sandra chevrier, by dave mckean and richard avedon and maciej kuciara, punk rock, tank girl, high detailed, 8k. model name: openjourney-v4, use this model when the prompt contains midjourney or mid-jouney or open journey. example prompt: a tattoo artist with blue tattoos and flowers on her skin, in the style of futuristic fantasy, intense gaze, oil portraitures, light red and teal, high resolution, rococo portraitures, dark & explosive, tattooed girl posing in photo shoot, in the style of digital manipulation, tanya shatseva, daniel f. gerhartz, dark pink and light blue, intricate imagery, uhd image, oil portraitures::2 --ar 2:3 --q 2 --s 1000 --v 5 --q 2 --s 750. model name: realistic-vision-v3, use this model for more realistic 1girl, man, woman, or a person prompt. example prompt: RAW photo, face portrait photo of beautiful 26 y.o woman, cute face, wearing black dress, happy face, hard shadows, cinematic shot, dramatic lighting. model name: neverending-dream, use this model if the prompt contains some dream words. Model name: eimis-anime-diffusion-v1-0, use this model if the prompt contains some animation keywords. Model name: xsarchitectural-interior-design, use this model if the prompt contains keywords such as architecture, lanscape, buildings and does not contain any human or person words. Model name: icbinp-final, use this model if the prompt contains keywords such as realistic, photography, art-station. use the lanscape mode - height:1024, width: 768 if the prompt is not about a person but outside. Use portait mode - height:768, width 1024 if the prompt contains 1girl, woman or a person as the subject. square mode - height:1024, width:1024 for if not able to decide. ";

    const llmprompt = new PromptTemplate({
        template:
          "use the prompt given by the user for image generation and enhance the prompt for midjourney.  compare and match the prompt to pick one model suitable for this prompt... Also choose what mode portrait, lanscape or square will be suitable for the prompt and pick the height and width from the example. output prompt, model, height and width. default height=768 and default width=1024. default mode should be portrait mode. Here's the example for model names and size. Height and width cannot exceed more than 1024. use this example to select the correct model, height and width " + exampleData + " \n{format_instructions}\n{iprompt}",
        inputVariables: ["iprompt"],
        partialVariables: { format_instructions: formatInstructions },
      });

      const model = new OpenAI({ temperature: 0, modelName: "gpt-3.5-turbo-16k-0613" });

    const input = await llmprompt.format({
      iprompt: prompt,
    });

    const response = await model.call(input);

    console.log(input);
    console.log(response);


    try {

      const options:Partial<TextToImageRequest>  = await parser.parse(response);
      if (options && options.model) options.model = findBestMatch(options.model, ModelIds);
      if (options && options.height) options.height = closestMultipleOf256(options.height);
      if (options && options.width) options.width= closestMultipleOf256(options.width);

      if (prompt.includes( 'portrait')) {
        options.height=1024
        options.width=768

      }
      if (prompt.includes('landscape')) {
        options.height=768
        options.width=1024

      }
      console.log(options);
      const content = await createGetImage(options);
      console.log(content);

      return content;


    } catch (error) {

      console.log(error)
      return null;

    }




}



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

function matchesKeyword(word: string, keyword: string): boolean {
  const pattern = new RegExp(`^${keyword}$`, 'i');
  return pattern.test(word);
}