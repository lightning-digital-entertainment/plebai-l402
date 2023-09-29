
import { generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getResults, saveBase64AsImageFile } from "../helpers";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ZepClient } from "@getzep/zep-js";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { SinkInRequest, SinkInResponse } from "./types";
import axios from "axios";
import * as fs from 'fs';


const parser = StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model_id: "id field given from the input prompt",
    width: "width of the image. valid range is 128 to 896",
    height: "height of the image. valid range is 128 to 896",
});


export async function createSinkinImageWithPrompt(prompt:string, model: string): Promise<string> {



        const data: SinkInRequest = {
            access_token: process.env.SINKIN_API,
            model_id: model?model:'wozEgKm', 
            prompt,
            num_images:1,
            width:512,
            height:768,
            //lora
        };

        console.log(data);

        const sinkinResponse = await makeSinkInRequest(data);

        console.log('Sinkin Response: ', sinkinResponse)

        return sinkinResponse.images[0];


}
export async function createSinkinImageWithPromptandLora(prompt:string, model: string, lora:string): Promise<string> {



    const data: SinkInRequest = {
        access_token: process.env.SINKIN_API,
        model_id: model?model:'wozEgKm', 
        prompt,
        num_images:1,
        width:512,
        height:768,
        lora
    };

    console.log(data);

    const sinkinResponse = await makeSinkInRequest(data);

    console.log('Sinkin Response: ', sinkinResponse)

    return sinkinResponse.images[0];


}

async function makeSinkInRequest(data: SinkInRequest): Promise<SinkInResponse> {
    const url = process.env.SINKIN_URL;
    const formData = new FormData();

    // Add all properties from data to formData
    for (const key in data) {
        if (data.hasOwnProperty(key) && typeof data[key as keyof SinkInRequest] !== 'undefined') {
            const value = data[key as keyof SinkInRequest];
            formData.append(key, value as any); // Use `as any` to handle different types including File
        }
    }

    const headers = {
        'Content-Type': 'multipart/form-data'
    };

    try {
        const response = await axios.post<SinkInResponse>(url, formData, { headers });
        return response.data;
    } catch (error) {
        console.error('Error making request:', error);
        throw error;
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


