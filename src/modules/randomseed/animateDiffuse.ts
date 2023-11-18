
import { generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getResults, saveBase64AsImageFile } from "../helpers";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ZepClient } from "@getzep/zep-js";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { animateRequest, asyncResponse, txt2imgRequest } from "./types";
import axios from "axios";
import * as fs from 'fs';


const parser = StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model_id: "id field given from the input prompt",
    width: "width of the image. valid range is 128 to 896",
    height: "height of the image. valid range is 128 to 896",
});


export async function createAnimateDiffuseWithPrompt(prompt:string, modelName: string, trackId:number): Promise<asyncResponse> {

    const negativePrompt = "(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg";

    const data: animateRequest = {
      model_name:modelName,
      prompt,
      width: 512,
      height: 640,
      negative_prompt:negativePrompt,
      steps: 20,
      cfg_scale: 7.5,
      number_of_images: 1,
      seed: -1,
      sampler_name: "DPM++ 2M Karras",
      webhook: process.env.ANIMATE_WEBHOOk_URL,
      track_id:trackId,
      motion_model_name: "mm_sd_v15_v2.ckpt",
      fps: 8,
      format: "MP4",
      video_length: 16
    };

    console.log(data);

    return  makeText2ImgRequest(data);


}

async function makeText2ImgRequest(data: txt2imgRequest): Promise<asyncResponse> {


    const result = await fetch(process.env.RANDOM_SEED_API_URL + '/animate-diffusion', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RANDOM_SEED_API_KEY
      },
    })

    if (result.status !== 200) {
      // throw new Error(result.statusText)
      console.log(result.statusText);
      return null;
    }

    return await result.json()



}






export async function createPromptUsingChatGPT (prompt: string): Promise<string> {



    const formatInstructions = parser.getFormatInstructions();

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(process.env.COLLECTION_NAME);

    const searchResults = await collection.search(
       {
          text: prompt,
       },
       3
    );

    const searchResult = getResults(searchResults);

    const model = new OpenAI({ temperature: 0, modelName: "gpt-3.5-turbo-16k-0613" });

    const chainA = loadQAStuffChain(model);
    const docs = [
        new Document({ pageContent:searchResult }),

    ];

    const resA = await chainA.call({
        input_documents: docs,
        question: "Can you create an image generation prompt based on " + prompt,
    });

    console.log('ResA: ', resA);


    const models = await getModels();

    // console.log('Models: ', models)

    const llmprompt = new PromptTemplate({
        template:
        "use the prompt given by the user and match it with the input models to get the output ```" + models + " ```"+  " \n{format_instructions}\n{iprompt}",
        inputVariables: ["iprompt"],
        partialVariables: { format_instructions: formatInstructions },
      });



    const input = await llmprompt.format({
      iprompt: resA.text ,
    });

    const response = await model.call(input);

    console.log(input);
    console.log(response);

    return response;


}


export async function getModels():Promise<string> {


    const axios = require('axios');
    const qs = require('qs');
    const data = qs.stringify({
      'access_token': '24638a7ba9114a88be474f2116a551d0'
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://sinkin.ai/api/models',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data
    };

    const response = await axios.request(config);


    // console.log(response.data.models.join(" "));

    if (!response.data.models) return '';

    return response.data.models.map((obj: { id: string; tags: []; }) => `${obj.id} (${obj.tags})`).join(" ");







}


