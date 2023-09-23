import { Request, Response, Router } from 'express';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import * as dotenv from 'dotenv';
import type { YoutubeParameters } from "serpapi";
import { getJson } from "serpapi";
import { YoutubeTranscript } from 'youtube-transcript';
import { ZepMemory } from "langchain/memory/zep";
import { Memory, Message} from '@getzep/zep-js';
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
import { ConversationChain, LLMChain } from "langchain/chains";
import { SerpAPI } from "langchain/tools";
import { Lsat } from '../modules/l402js'
import { getLsatToChallenge, sendHeaders, vetifyLsatToken } from '../modules/helpers';
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { WebBrowser } from "langchain/tools/webbrowser";
import { Calculator } from "langchain/tools/calculator";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { OpenAI } from "langchain/llms/openai";
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { StructuredOutputParser } from "langchain/output_parsers";
import { createImage } from '../modules/genimage/createImage';
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { getResults } from '../vivekdoc';
import { TextToImageRequest } from '../modules/getimage/text-to-image';
import { createGetImage, createGetImageWithPrompt } from '../modules/getimage/createText2Image';
import { createNIP94Event } from '../modules/nip94event/createEvent';
import 'websocket-polyfill';
import { createTogetherAIImageWithPrompt } from '../modules/togetherai/createimage';
import {removeKeyword} from '../modules/helpers'


dotenv.config();
const wordRegex = /\s+/g;
const sessionId = "";

// const zepClient = new ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);

const createChatCompletion = (content: string | null, role: string | null, finishReason: string | null): ChatCompletion => {
  const id = uuidv4()

  return {
    id: "chatcmpl-"+ Buffer.from(id),
    model: "plebai-l402",
    created: Date.now(),
    object: "chat.completion.chunk",
    choices: [
      {
        index: 0,
        delta: {
          role,
          content

        },
        finish_reason: finishReason
      }
    ]
  };
};

const l402 = Router();

const openai = new OpenAI({
  apiKey: process.env.ROUTER_API_KEY,
  baseURL: process.env.ROUTER_URL,
  defaultHeaders: { "HTTP-Referer": process.env.PLEBAI_URL ,"X-Title": 'PlebAI' },

});

l402.post('/completions', async (req: Request, res: Response) => {

  const body = req.body;

  console.log('body: ', body);

  const sendData = (data: string) => {
    if (body.stream?body.stream:false) {
      res.write(`event: completion \n`);
      res.write(`data: ${data}\n\n`);

    }
  };



  if (body.system_purpose === 'GenImage') {

    try {


      const prompt = body.messages[body.messages.length -1].content;

      console.log('ImageGen: ' +body.messages[body.messages.length -1].content + ' ' );

      let content = '';

      const {keyword, modifiedString } = removeKeyword(prompt)
      if (keyword) {
          if (keyword === '/photo') content = await createTogetherAIImageWithPrompt(modifiedString, 'SG161222/Realistic_Vision_V3.0_VAE', 768,512);
          if (keyword === '/midjourney') content = await createTogetherAIImageWithPrompt(modifiedString, 'prompthero/openjourney',512,512);
          console.log('image created with ' + keyword);
      }

      if (content === '') content = await createTogetherAIImageWithPrompt(prompt, 'stabilityai/stable-diffusion-xl-base-1.0', 1024,1024);

      sendData(JSON.stringify(createChatCompletion( content, null, null)));

      await createNIP94Event(content, null, body.messages[body.messages.length -1].content);

      // sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));

    } catch (error) {

      console.log(error)
      sleep(500);
      sendData(JSON.stringify(createChatCompletion('Unable to create image due to server issue. Please try later...' , null, null)));

    }


    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();

    return;

  }
  if (body.system_purpose === 'Vivek2024' || body.system_purpose === 'DocGPT') {

    console.log('inside Vivek');

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(body.system_purpose === 'Vivek2024'?process.env.COLLECTION_NAME:process.env.MEDICAL_COLLECTION_NAME);

    let searchResult = '';


    try {

      const searchResults = await collection.search(
        {
           text: body.messages[body.messages.length -1].content,
        },
        5
      );
      console.log(
          `Found ${searchResults.length} documents matching query '${body.messages[body.messages.length -1].content}'`
      );
      // printResults(searchResults);

      searchResult = getResults(searchResults);

      body.messages[0].content = body.messages[0].content + '. Use this information I found on the web: ' + searchResult + ' ';

    } catch (error) {

      console.log(error)


    }

  }

  const messages= getMessages(body.messages);

  console.log('Input prompt: ' + JSON.stringify(messages));

  const stream = await openai.chat.completions.create({

    messages,
    model: body.llm_router,
    max_tokens: body.max_tokens,
    stream: true,
    temperature: body.temperature

  });

  for await (const part of stream) {
    sendData(JSON.stringify(createChatCompletion(part.choices[0]?.delta?.content, null, null)));
  }

  if (body.system_purpose === 'Vivek2024') sendData(JSON.stringify(createChatCompletion("\n\nTo donate to Vivek's campaign, Go to https://vivek2024.link/donate", null, null)));

  sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
  sendData('[DONE]');
  res.end();



});

export default l402;

interface ChatCompletion {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: Choice[];
}

interface Choice {
  index: number;
  delta: Delta;
  finish_reason: string | null;
}

interface Delta {
  role: string | null;
  content: string | null;
}

interface Conversation {
  role: string;
  content: string;
}



async function lsatChallenge(requestBody: string, res: Response): Promise<Response<any, Record<string, any>>> {
  const lsat:Lsat = await getLsatToChallenge(requestBody, parseInt(process.env.SATS_AMOUNT, 10));
  return res.setHeader('WWW-Authenticate', lsat.toChallenge()).status(402).send('');
}


function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const getMessages = (messages: Message[]):any => {
  if (messages.length > 8) {
    const firstMessage = messages[0];
    const lastFiveMessages = messages.slice(-5);
    return [firstMessage, ...lastFiveMessages];

  } else return messages;

};