import { Request, Response, Router } from 'express';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import * as dotenv from 'dotenv';
import type { YoutubeParameters } from "serpapi";
import { getJson } from "serpapi";
import { YoutubeTranscript } from 'youtube-transcript';
import { ZepMemory } from "langchain/memory/zep";
import { Memory, Message, ZepClient } from '@getzep/zep-js';
import { PromptTemplate } from "langchain/prompts";
import { ConversationChain } from "langchain/chains";

dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";

const zepClient = new ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);

const createChatCompletion = (content: string | null, role: string | null, finishReason: string | null): ChatCompletion => {
  return {
    id: "chatcmpl-500307f7-4a6c-4c7b-8caf-6d44bfc4220b",
    model: "gpt-4-all",
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

l402.post('/completions', async (req: Request, res: Response) => {

  const body = req.body;

  console.log('Body: ', body);

  const headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Connection': 'keep-alive',
    'server': 'uvicorn',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'chunked'
  };

  res.writeHead(200, headers);

  const sendData = (data: string) => {
    res.write(`event: completion \n`);
    res.write(`data: ${data}\n\n`);
  };

  let summaryTokens='';
  const chat = new ChatOpenAI({temperature: 0.5, modelName: 'gpt-3.5-turbo-16k-0613',
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          summaryTokens=summaryTokens+ ' ' + token;
          sendData(JSON.stringify(createChatCompletion(token, null, null)));
        },
      },
    ],


  });

  sendData(JSON.stringify(createChatCompletion(null, 'assistant', null)));

  let link='';

  const params = {
    api_key: process.env.SERP_API_KEY,
    search_query: body.messages[1].content
  } satisfies YoutubeParameters;

  const serpResponse = await getJson("youtube", params);
  console.log(serpResponse);

  link = serpResponse.video_results[0].link;

  // sendData(JSON.stringify(createChatCompletion( serpResponse.video_results[0].thumbnail.static + ' \n', null, null)));

  link = YouTubeGetID(link);

  console.log('link is: %o', link)

  sessionId = link;

  const memory = new ZepMemory({
    sessionId,
    baseURL: process.env.ZEP_API_URL,
    apiKey: process.env.OPENAI_API_KEY,

  });

  const pastHistory = await memory.loadMemoryVariables({});


  if (body.messages.length === 2) {

    try {

      sendData(JSON.stringify(createChatCompletion( 'Found the Youtube video ... ' + serpResponse.video_results[0].title + '\n ', null, null)));

      sendData(JSON.stringify(createChatCompletion('Searching YouTube to get the transcript.... \n', null, null)));


      if (link.length > 0 ) {

        const transcript = await YoutubeTranscript.fetchTranscript(link);
        const extractedTextsArray: string[] = transcript.map((data) => data.text);
        const extractedText: string = extractedTextsArray.join(' ');


        // console.log(extractedText);

         const chunkSize = 16000;
         const stringChunks = splitStringIntoChunks(extractedText, chunkSize);

         sendData(JSON.stringify(createChatCompletion( "Here's transcript summary: \n" , null, null)));

         for (const chunk of stringChunks) {

          await chat.call([
            new SystemMessage(body.messages[0]),
            new HumanMessage(
              chunk
            ),

          ]);


         }

         sendData(JSON.stringify(createChatCompletion( '\n Here are suggested questions to ask: \n ', null, null)));

         await chat.call([
          new HumanMessage(
            "Can you suggest five questions from this summary? " + summaryTokens
          ),

        ]);

        if (pastHistory.history === '') {

          const history = [
            { role: "human", content: "Here is the summary of the transscript for youtube video  " + serpResponse.video_results[0].title + ' ' + summaryTokens }
          ];

          const messages = history.map(
            ({ role, content }) => new Message({ role, content })
          );
          const memory2 = new Memory({ messages });

          const resultUpdate = await zepClient.addMemory(sessionId, memory2);

          console.log('Zep Update: %o', resultUpdate)


        }



      }

    } catch (error) {

      console.log('In catch with error: %o', error)

      sendData(JSON.stringify(createChatCompletion( '\n I am not able to find any youtube video with a transcript. Can you please try with a different search? \n ', null, null)));

    }


  } else {

    console.log('In else...');

    const prompt = PromptTemplate.fromTemplate(' Please use transcript to answer the prompt. {history}  {input} ' );
    const chain = new ConversationChain({ llm: chat, prompt, memory  });
    await chain.call({input: body.messages[body.messages.length -1].content});





  }

  // res.setHeader('WWW-Authenticate', 'macroon:invoice').status(402).send('');

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

function YouTubeGetID(url: any){
  url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  return (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
}

function splitStringIntoChunks(str: string, chunkSize: number): string[] {
  const words = str.split(/\s+/); // Split the string into an array of words
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + word).length <= chunkSize) {
      currentChunk += (currentChunk === '' ? '' : ' ') + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk !== '') {
    chunks.push(currentChunk);

  }

  return chunks;
}

