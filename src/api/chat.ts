import { Request, Response, Router } from 'express';
import * as dotenv from 'dotenv';
import { Memory, Message} from '@getzep/zep-js';
import { SerpAPI } from "langchain/tools";
import { Lsat } from '../modules/l402js'
import { generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getLsatToChallenge, saveBase64AsImageFile, sendHeaders, vetifyLsatToken } from '../modules/helpers';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { getResults } from '../vivekdoc';
import { createNIP94Event } from '../modules/nip94event/createEvent';
import 'websocket-polyfill';
import { createTogetherAIImageWithPrompt } from '../modules/togetherai/createimage';
import {removeKeyword} from '../modules/helpers'
import { getAgentById, getAnimateData, insertData } from './data';
import { createSinkinImageWithPrompt, createSinkinImageWithPromptandLora } from '../modules/sinkin/createimage';
import { createAnimateDiffuseWithPrompt } from '../modules/randomseed/animateDiffuse';
import { createTxt2ImgWithPrompt } from '../modules/randomseed/txt2img';
import { syncResponse } from '../modules/randomseed/types';


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

  

  let summaryTokens = ''
  const userMessage = body.messages[body.messages.length -1].content;

      
  const agentData:any = await getAgentById(body.system_purpose);

  console.log('agentData: ', agentData);


  try {

        const prompt = body.messages[body.messages.length -1].content;


        if (agentData?.req_type !== null && agentData?.req_type === 'randomseed') {

          if (agentData?.genanimation) {

            const trackId = generateRandom9DigitNumber();

            const response = await createAnimateDiffuseWithPrompt(prompt, agentData.modelid, trackId);

            if (response) {
                const result = await getAnimateData(trackId);

                console.log(result.output.image_urls[0] );

                summaryTokens = result.output.image_urls[0];

                if (body?.stream) {
                  sendStream(JSON.stringify(createChatCompletion(result.output.image_urls[0], null, null)), res);
                  await sleep(1000);
                  endStream(res);
                } else {
                  res.send(result.output.image_urls[0]);
    
                } 
      
                  // save data for logs.
                  await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                  [body.messageId, body.conversationId,  body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  summaryTokens, req.body, req.body]);
              
                  
                  return;

            }
          }

          if (agentData?.genimage) {

              try {

                console.log('prompt: ', prompt)

                const lora = ' ' + agentData?.lora?agentData?.lora:'';
  
                const response: syncResponse = await createTxt2ImgWithPrompt((prompt +  lora), agentData.modelid, agentData.image_height?agentData.image_height:1024, agentData.image_width?agentData.image_width:1024);
  
                if (response) {
  
                  if (body?.stream) {
                    sendStream(JSON.stringify(createChatCompletion(response.output[0] , null, null)), res);
                    await sleep(1000);
                    endStream(res);
                  } else {
                    res.send(response.output[0]);
      
                  } 
        
                    // save data for logs.
                    await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                    [body.messageId, body.conversationId,  body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  response.output[0], req.body  , req.body]);
  
                    await createNIP94Event(response.output[0], null, body.messages[body.messages.length -1].content);
                    
                    
  
  
                }
                
              } catch (error) {

                console.log(error);
                
              }

              return;


            
          }




        }

       

        if (agentData && agentData?.genimage && agentData?.modelid) {

              
          try {

            
            let content = '';
            
            if (agentData?.lora) {

              if (content === '') content = await createSinkinImageWithPromptandLora(prompt, agentData.modelid, agentData.lora);
            } else {

              if (content === '') content = await createSinkinImageWithPrompt(prompt, agentData.modelid);
            }
            
            const imageString = await getBase64ImageFromURL(content);
            const id = uuidv4();
            saveBase64AsImageFile(id + '.png', imageString);
            const currentImageString = await getImageUrl(id, 'png');

            if (body?.stream) {
              sendStream(JSON.stringify(createChatCompletion(currentImageString, null, null)), res);

            } else {
              res.send(currentImageString);

            }
   
            

            await createNIP94Event(currentImageString, null, body.messages[body.messages.length -1].content);

            
          } catch (error) {
            
            console.log(error)
          }
      
          if (body?.stream) endStream(res);
      
          // save data for logs.
          await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [body.messageId, body.conversationId, body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  summaryTokens, req.body, req.body]);
      
          
          return;




        }

  } catch (error) {

    console.log('In catch checking if it is genImage agent: ', error)
    
  }


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

      summaryTokens = content;

      if (body?.stream) {
        sendStream(JSON.stringify(createChatCompletion( content, null, null)), res);
      } else {
        res.send(content);

      }
      

      await createNIP94Event(content, null, body.messages[body.messages.length -1].content);

      // sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));

    } catch (error) {

      console.log(error)
      sleep(500);
      sendStream(JSON.stringify(createChatCompletion('Unable to create image due to server issue. Please try later...' , null, null)), res);

    }


    if (body?.stream) endStream(res);

    // save data for logs.
    await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [body.messageId, body.conversationId,  body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  summaryTokens, req.body, req.body]);


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

  if (body?.stream) {

        try {

          const stream = await openai.chat.completions.create({

            messages,
            model: body.llm_router,
            max_tokens: body.max_tokens,
            stream: true,
            temperature: body.temperature
  
          });
  
          for await (const part of stream) {
            summaryTokens = summaryTokens + part.choices[0]?.delta?.content
            sendStream(JSON.stringify(createChatCompletion(part.choices[0]?.delta?.content, null, null)), res);
          }
  
          if (body.system_purpose === 'Vivek2024') sendStream(JSON.stringify(createChatCompletion("\n\nTo donate to Vivek's campaign, Go to https://vivek2024.link/donate", null, null)), res);
          
        } catch (error) {

          console.log(error)
          
        }

        if (agentData?.suggestion) {        

          const questionStream = await openai.chat.completions.create({

            messages: [
              {"role": "system", "content": "can you suggest not more than two related conversational question for the user to ask back to you chatGPT? These questions have to be leading questions for the user to continue the conversation. respond with only questions and end each question with '\n'. Do not include hyphens or number ``` "},
              {"role": "user", "content": summaryTokens + ' ```'}
            ],
            model: 'mistralai/mistral-7b-instruct',
            max_tokens: 1024,
            stream: false,
            temperature: 0.1

          });

          sendStream(JSON.stringify(createChatCompletion("\nQuestions:- \n", null, null)), res);

          sendStream(JSON.stringify(createChatCompletion(questionStream.choices[0].message.content, null, null)), res);



        }

        
        //end stream 
        endStream(res);


  } else {

        try {

          const stream:any = await openai.chat.completions.create({

            messages,
            model: body.llm_router,
            max_tokens: body.max_tokens,
            stream: false,
            temperature: body.temperature
  
          });
  
          console.log('stream', stream)
  
          res.send(stream.choices[0].message.content);
  
          
        } catch (error) {

          console.log(error);

          res.send('Error in getting response. Please try again later. ');
          
        }

        

  }

       

  await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [body.messageId, body.conversationId,  body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  summaryTokens, req.body, req.body]);


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


async function sendStream(data:string, res:Response) {
  
  res.write(`event: completion \n`);
  res.write(`data: ${data}\n\n`);
}

async function endStream(res:Response) {

  sendStream(JSON.stringify(createChatCompletion(null, '', 'stop')), res);
  sendStream('[DONE]', res);
  res.end();


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