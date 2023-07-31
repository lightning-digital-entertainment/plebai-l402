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
import { ConversationChain, LLMChain } from "langchain/chains";
import { DynamicTool, SerpAPI } from "langchain/tools";
import { Lsat } from '../modules/l402js'
import { getLsatToChallenge, sendHeaders, vetifyLsatToken } from '../modules/helpers';
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { WebBrowser } from "langchain/tools/webbrowser";
import { Calculator } from "langchain/tools/calculator";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { v4 as uuidv4 } from 'uuid';
import { StructuredOutputParser } from "langchain/output_parsers";
import { createImage } from '../modules/genimage/createImage';




dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";

const zepClient = new ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);

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



l402.post('/testing', async (req: Request, res: Response) => {

  console.log(req.headers);



  if (req.headers.authorization) {

    // validate Auth and confirm
    if (!(vetifyLsatToken(req.headers.authorization, req.body))) return lsatChallenge(req.body, res);

    // All good to execute
    res.status(200).send('Success');

  } else {

    // no auth found. so create macroon, invoice and send it back to client with 402
    return lsatChallenge(req.body, res);
  }

});

l402.post('/completions', async (req: Request, res: Response) => {

  // included 'localhost' for local dev/test. Use ip address if you want to run locally and return 402.
  if (!req.headers.host.startsWith('localhost') && !req.headers.authorization) {
       // no auth found. so create macroon, invoice and send it back to client with 402
      return lsatChallenge(req.body, res);

  }

  if (!req.headers.host.startsWith('localhost') && req.headers.authorization) {

    // validate Auth and confirm
    if (!(vetifyLsatToken(req.headers.authorization, req.body))) return lsatChallenge(req.body, res);

  }

  // if you are here, then it is localhost or L402 Auth passed.

  const body = req.body;

  console.log('body: ', body);

  const sendData = (data: string) => {
    if (body.stream?body.stream:false) {
      res.write(`event: completion \n`);
      res.write(`data: ${data}\n\n`);

    }
  };

  if (body.stream?body.stream:false) {
    res.writeHead(200, sendHeaders(true));
    sendData(JSON.stringify(createChatCompletion(null, 'assistant', null)));
  }


  // This is used in plebAI.com

  if (body.system_purpose === 'HumanAI') {



    const llm = new OpenAI({
      temperature: 0.5,
      modelName: 'gpt-3.5-turbo-16k-0613',
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            sendData(JSON.stringify(createChatCompletion(token, null, null)));
          },
        },
      ],


    });



    const response = await llm.predict(JSON.stringify(body.messages));

    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();



    return;
  }

  if (body.system_purpose === 'GenImage') {

    try {

      sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));

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
  if (body.system_purpose === 'Developer' || body.system_purpose === 'Teacher') {



    body.stream = false;

    const headerRequest = {
      'Content-Type': 'application/json',
    }

    const response = await fetch(process.env.LLAMA_7B,  { headers: headerRequest, method: 'POST', body: JSON.stringify(body) } )

    const token = await response.json();
    body.stream = true;
    console.log(token.choices[0].message);
    sendData(JSON.stringify(createChatCompletion( token.choices[0].message.content , null, null)));
    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();

    return;


  }

  let summaryTokens='';

  if (body.system_purpose === 'OrangePill') {

    const model = new OpenAI({ temperature: 0, modelName: 'davinci-search-query' });
    const chat2 = new ChatOpenAI({temperature: 0.5, modelName: 'gpt-4-0314',
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          summaryTokens=summaryTokens+ token;
          sendData(JSON.stringify(createChatCompletion(token, null, null)));
        },
      },
    ],


    });


    const embeddings = new OpenAIEmbeddings();
    const tools = [
      new SerpAPI(process.env.SERP_API_KEY, {
        hl: "en",
        gl: "us",
      }),
      new Calculator(),
      new WebBrowser({ model, embeddings }),
    ];


    try {

      const executor = await initializeAgentExecutorWithOptions(tools,chat2, {
        agentType: "structured-chat-zero-shot-react-description",
        returnIntermediateSteps: true,
      });

      // const input = body.messages.map((message: Message) => message.content).join(' ');
      await executor.call({ input: body.messages[0].content + ' ' + body.messages[body.messages.length -1].content });

    } catch (error) {
      console.log('In catch with error: ', error)
      sendData(JSON.stringify(createChatCompletion( '\n\n  Error occurred when searching for an answer. Can you retry again? ' , null, null)));

    }

    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();

    return;
  }


  const chat = new ChatOpenAI({temperature: 0.5, modelName: 'gpt-3.5-turbo-16k-0613',
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          summaryTokens=summaryTokens+ token;
          sendData(JSON.stringify(createChatCompletion(token, null, null)));
        },
      },
    ],


  });




  let link='';

  try {
    console.log('inside trying to get the video link ')
    link = YouTubeGetID(body.messages[1].content);

    console.log('link from content is: %o', link)

  } catch (error) {

    console.log('Error: ', error)

  }


  // try another way to get the link
  if (link === '') {

    try {

      console.log('inside trying to get the video link using ChatpGPT')
      const parser = StructuredOutputParser.fromNamesAndDescriptions({
        videoID: "Youtube video ID"
      });
      const formatInstructions = parser.getFormatInstructions();

      const prompt = new PromptTemplate({
        template:
          "Get the youtube video ID from this text .\n{format_instructions}\n{question}",
        inputVariables: ["question"],
        partialVariables: { format_instructions: formatInstructions },
      });


      const model = new OpenAI({ temperature: 0 });

      const input = await prompt.format({
        question: body.messages[1].content,
      });
      const promptResponse = await model.call(input);

      console.log('Input: ', input);
      console.log('Response: ', promptResponse);

      const listResponse = await parser.parse(promptResponse);

      console.log(listResponse);


    } catch (error) {

      console.log('incatch with error: ', error)

    }



  }

  const params = {
    api_key: process.env.SERP_API_KEY,
    search_query: link!==''?link:body.messages[1].content
  } satisfies YoutubeParameters;

  const serpResponse = await getJson("youtube", params);
  console.log(serpResponse);

  link = serpResponse.video_results[0].link;

  // sendData(JSON.stringify(createChatCompletion( serpResponse.video_results[0].thumbnail.static + ' \n', null, null)));

  link = YouTubeGetID(link);

  console.log('link is: %o', link)

  summaryTokens = 'Found the Youtube video ... ' + serpResponse.video_results[0].title
  + ' with video length: ' + serpResponse.video_results[0].length
  +  ' with views: ' + serpResponse.video_results[0].views
  + ' published ' + serpResponse.video_results[0].published_date
  + ' and youtube link: ' + serpResponse.video_results[0].link + '\n ';




  sessionId = link;

  const memory = new ZepMemory({
    sessionId,
    baseURL: process.env.ZEP_API_URL,
    apiKey: process.env.OPENAI_API_KEY,

  });

  const pastHistory = await memory.loadMemoryVariables({});


  if (body.messages.length === 2) {

    try {



      sendData(JSON.stringify(createChatCompletion(summaryTokens , null, null)));

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


         if (body.stream?body.stream:false) {
          sendData(JSON.stringify(createChatCompletion( '\n\n Here are suggested questions to ask and learn more about: \n ', null, null)));

         } else {
          summaryTokens = summaryTokens + '\n\n Here are suggested questions to ask and learn more about: \n ';

         }


         await chat.call([
          new HumanMessage(
            "Can you suggest five questions from this summary? " + summaryTokens
          ),

        ]);

        if (pastHistory.history === '') {

          const history = [
            { role: "human", content: "Here is the summary of the transscript for youtube video  " + summaryTokens }
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

    try {

      const prompt = PromptTemplate.fromTemplate(' Please use transcript to answer the prompt. {history}  {input} ' );
      const chain = new ConversationChain({ llm: chat, prompt, memory  });
      await chain.call({input: body.messages[body.messages.length -1].content});

    } catch (error) {

      console.log('In catch with error: %o', error)

      sendData(JSON.stringify(createChatCompletion( '\n I am not able to find any youtube video with a transcript. Can you please try with a different search? \n ', null, null)));


    }



  }

  if (body.stream?body.stream:false) {
    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();
  } else {

    res.setHeader('Content-Type', 'application/json').send(JSON.stringify(createChatCompletion(summaryTokens, 'assistant', 'stop')))

  }



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

async function lsatChallenge(requestBody: string, res: Response): Promise<Response<any, Record<string, any>>> {
  const lsat:Lsat = await getLsatToChallenge(requestBody, parseInt(process.env.SATS_AMOUNT, 10));
  return res.setHeader('WWW-Authenticate', lsat.toChallenge()).status(402).send('');
}


function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
