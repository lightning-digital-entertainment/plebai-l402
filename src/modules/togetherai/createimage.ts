
import { generateRandom5DigitNumber, generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getResults, saveBase64AsImageFile } from "../helpers";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ZepClient } from "@getzep/zep-js";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { writeFileSync} from 'fs'
import { v4 as uuidv4 } from 'uuid';

import axios from "axios";
import * as fs from 'fs';
import { tgAIRequest, tgAIResponse } from "./types";


const parser = StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model_id: "id field given from the input prompt",
    width: "width of the image. valid range is 128 to 896",
    height: "height of the image. valid range is 128 to 896",
});


export async function createTogetherAIImageWithPrompt(prompt:string, model:string, height:number, width:number): Promise<string> {

        const id = uuidv4();
        const outputFormat = "jpg";
        const data: tgAIRequest = {
            model,
            prompt,
            request_type:"image-model-inference",
            width:width?width:512,
            height:height?height:512,
            steps: 50,
            update_at: getFormattedTimestamp(),
            seed: generateRandom5DigitNumber(),
            n: 1,
            // image_base64: imageUrl
        };

        const togetherAIResponse = await makeTogetherAIRequest(data);

        console.log('Together Response: ', togetherAIResponse)

        if (togetherAIResponse.output.choices[0]) {
            writeFileSync( process.env.UPLOAD_PATH + id + `.` + outputFormat, togetherAIResponse.output.choices[0].image_base64, 'base64')
            const imageUrl = await getImageUrl( id, outputFormat);
            console.log('Image URL: ', imageUrl)
            return imageUrl


        } else {

            return ''
        }




}

async function makeTogetherAIRequest(data: tgAIRequest): Promise<tgAIResponse> {
    const url = process.env.TGAI_URL;

    const headers = {
        Authorization: process.env.TGAI_API
    };

    try {
        const response = await axios.post<tgAIResponse>(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error('Error making request:', error);
        throw error;
    }
}




function getFormattedTimestamp(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  }


