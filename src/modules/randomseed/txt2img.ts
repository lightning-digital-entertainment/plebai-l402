
import { generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getResults, saveBase64AsImageFile } from "../helpers";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ZepClient } from "@getzep/zep-js";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { asyncResponse, syncResponse, txt2imgRequest } from "./types";
import { setTimeout } from 'timers/promises';


const parser = StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model_id: "id field given from the input prompt",
    width: "width of the image. valid range is 128 to 896",
    height: "height of the image. valid range is 128 to 896",
});


export async function createTxt2ImgWithPrompt(prompt:string, model: string, height:number, width:number): Promise<syncResponse> {

    const negativePrompt = "(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg";


    const data: txt2imgRequest = {
      model_name: model,
      prompt,
      width,
      height,
      negative_prompt: negativePrompt,
      steps: 30,
      cfg_scale: 7.5,
      number_of_images: 1,
      seed: -1,
      sampler_name: "DPM++ 2M Karras",
 
    };

    console.log(data);

    return await makeText2ImgRequestAsync(data);



}

async function makeText2ImgRequest(data: txt2imgRequest): Promise<syncResponse> {
    

    const result = await fetch(process.env.RANDOM_SEED_API_URL + '/sync/txt2img', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RANDOM_SEED_API_KEY
      },
    })

    if (result.status !== 200) {
      console.log(result.statusText);
      return null;
    }

    return await result.json()

    
    
}

async function makeText2ImgRequestAsync(data: txt2imgRequest): Promise<syncResponse> {
    

  const result = await fetch(process.env.RANDOM_SEED_API_URL + '/txt2img', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.RANDOM_SEED_API_KEY
    },
  })

  if (result.status !== 200) {
    console.log(result.statusText);
    return null;
  }

  const response = await result.json();

  console.log('txt2img response: ', response);

  if (response.result.id) {
        while (true) {
          const output = await fetch(process.env.RANDOM_SEED_API_URL + '/status/' + response.result.id, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + process.env.RANDOM_SEED_API_KEY
            },
          })

          const outputJson = await output.json();

          //console.log('outputJson: ', outputJson);

          if (outputJson.status === 'COMPLETED') {

            const getResponse:syncResponse = {};

            getResponse.output = outputJson.output.image_urls;

            console.log('getResponse: ', getResponse)

            return getResponse;

          }

          if (outputJson.status === 'FAILED') {

            const getResponse:syncResponse = {};

            getResponse.output = ['With a roaring thunder, Image generation failed. To request refund, Please contact us on Discord. '];

            console.log('getResponse: ', getResponse)

            return getResponse;

          }

          

          await setTimeout(1000);
        }



  }

  

  
  
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


export async function getModels():Promise<Model[]> {

    const output = await fetch(process.env.RANDOM_SEED_API_URL + '/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RANDOM_SEED_API_KEY
      },
    })

    
    const outputJson = await output.json();
    
    return (extractModels(outputJson));

     




}


export type Model = {
  model_name: string;
  model_type: string;
};


const extractModels = (data: any): Model[] => {
  const publicModels: Model[] = data.public_models.map((item: any) => ({
    model_name: item.model_name,
    model_type: item.model_type,
  }));

  const privateModels: Model[] = data.private_models.map((item: any) => ({
    model_name: item.model_name,
    model_type: item.model_type,
  }));

  return [...publicModels, ...privateModels];
};





