import { Request, Response, Router } from 'express';
import * as dotenv from 'dotenv';
import { ICreateUserRequest, ISearchQuery, ISession, Memory, Message, Session} from '@getzep/zep-js';
import { SerpAPI } from "langchain/tools";
import { Lsat } from '../modules/l402js'
import { deleteImageUrl, extractUrl, extractUrls, generateRandom9DigitNumber, getBase64ImageFromURL, getImageUrl, getLsatToChallenge, saveBase64AsImageFile, sendHeaders, splitStringByUrl, vetifyLsatToken } from '../modules/helpers';
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
import { createTxt2ImgWithPrompt, removeBackground } from '../modules/randomseed/txt2img';
import { backResponse, syncResponse } from '../modules/randomseed/types';
import { RunStep } from 'openai/resources/beta/threads/runs/steps';
import {  textResponseWithZep, visionResponse } from '../modules/openai/chatCompletion';
import { textResponse } from '../modules/perplexity/createText';
import { TavilySearchAPIRetriever } from "langchain/retrievers/tavily_search_api"
import { videoGen } from '../modules/replicate/videoGen';
import { upscaleGen } from '../modules/replicate/upscaleGen';
import { photoMaker } from '../modules/replicate/photoMaker';
import { genTextUsingPrem } from '../modules/premai/generateText';


dotenv.config();
const wordRegex = /\s+/g;

// const zepClient = new ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);

let zepClient: any;
zepClient = ZepClient.init(process.env.ZEP_API_URL, process.env.ZEP_API_KEY)
                      .then(resolvedClient => {
                        zepClient = resolvedClient
                          console.log('Connected to Zep...')
                      })
                      .catch(error => {
                          console.log('Error connecting to Zep')
                      });

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
  apiKey: process.env.OPENAI_API_KEY,

});

const openRouter = new OpenAI({
  apiKey: process.env.ROUTER_API_KEY,
  baseURL: process.env.ROUTER_URL,
  defaultHeaders: { "HTTP-Referer": process.env.PLEBAI_URL ,"X-Title": 'PlebAI' },

});

const gputopia = new OpenAI({
  apiKey: process.env.GPUTOPIA_API_KEY,
  baseURL:process.env.GPUTOPIA_WEBHOOK_URL,

});

l402.post('/completions', async (req: Request, res: Response) => {

  const body = req.body;

  console.log('body: ', body);



  let summaryTokens = ''


  const agentData:any = await getAgentById(body.system_purpose);

  console.log('agentData: ', agentData);

  let userID:any;

  try {
    userID = await zepClient.user.get(body.app_fingerprint?body.app_fingerprint:uuidv4());

  } catch (error) {
      console.log('Going to create new user...')

      const newUser: ICreateUserRequest = {
        user_id: body.app_fingerprint?body.app_fingerprint:uuidv4(),
        metadata: { agent: body.system_purpose, createdDate: Date.now() },
      };
      userID = await zepClient.user.add(newUser);

  }

  console.log('Zep user: ', JSON.stringify(userID));


  try {

        const prompt = body.messages[body.messages.length -1].content;

        try {

          if (agentData?.iresearch) {
            const retriever = new TavilySearchAPIRetriever({
              searchDepth:"advanced",

              apiKey: process.env.TAVILY_API_KEY,
              k: 3,
            });

            const retrievedDocs = await retriever.getRelevantDocuments(' Get relevant company information for ' + agentData.title + ' and the user question is ' + prompt);

            console.log({ retrievedDocs });

            body.messages[0].content = body.messages[0].content.replace('{iresearch}', JSON.stringify(retrievedDocs));

            console.log('Modified system prompt: ', body.messages[0].content);

          }

        } catch (error) {

          console.log('Error in tavily: ', error);

        }



        if(agentData?.getzep)
        {

          console.log('getting embedding data from Zep');

          try {

            const collection = await zepClient.document.getCollection(agentData.collectionname?agentData.collectionname:'');


            const mmrSearchQuery: ISearchQuery = {
              text: body.messages[body.messages.length -1].content,
              searchType: "mmr",
              mmrLambda: 0.5,
            };


            const mmrSearchResults = await collection.search(mmrSearchQuery, 3);

            // console.log('mmr Search: ',mmrSearchResults );

            const filteredResults = mmrSearchResults.map((item: { content: any; metadata: any; }) => ({
              content: item.content,
              metadata: item.metadata
            }));

            console.log('mmr filtered Search: ',filteredResults );

            body.messages[0].content = body.messages[0].content + '. Only Use this information and cite the metadata source for reference: ' + JSON.stringify(filteredResults) + ' ';

          } catch (error) {

            console.log(error)


          }

        }

        if (agentData?.req_type !== null && agentData?.req_type === 'premai'){

          const toolsToUse = {};

          await genTextUsingPrem(agentData, body.messages, toolsToUse, (result) => {
            for (const part of result) {
              sendStream(JSON.stringify(createChatCompletion(part, null, null)), res);
              summaryTokens=summaryTokens+ part;

            }


          })

          await sleep(1000);
          endStream(res);
          updateLogs(body, summaryTokens, userID);

          return;


        }




        if (agentData?.req_type !== null && agentData?.req_type === 'replicate' && agentData.llmrouter === 'videogen') {

                const inputImage = extractUrl(prompt);

                if (inputImage.startsWith('https://')) {

                  const response = await videoGen(agentData.modelid, inputImage, agentData.lora);

                  if (response) {
                    console.log(response);
                    if (body?.stream) {
                      sendStream(JSON.stringify(createChatCompletion(response , null, null)), res);
                      await sleep(1000);
                      endStream(res);
                    } else {
                      res.send(response);

                    }

                    updateLogs(body, response, userID);

                    return;


                  } else {



                    if (body?.stream) {
                      sendStream(JSON.stringify(createChatCompletion('Error: Input image is needed. Please attach an image' , null, null)), res);
                      await sleep(1000);
                      endStream(res);
                    } else {
                      res.send(response);

                    }

                    updateLogs(body, response, userID);

                    return;


                  }

                }


        }

        if (agentData?.req_type !== null && agentData?.req_type === 'replicate' && agentData.llmrouter === 'photomaker') {

          const inputImage = extractUrl(prompt);

          if (inputImage.startsWith('https://')) {

            const response = await photoMaker(agentData.modelid, inputImage, prompt);

            if (response) {
              console.log(response);
              if (body?.stream) {
                sendStream(JSON.stringify(createChatCompletion(response , null, null)), res);
                await sleep(1000);
                endStream(res);
              } else {
                res.send(response);

              }

              updateLogs(body, response, userID);

              return;


            } else {



              if (body?.stream) {
                sendStream(JSON.stringify(createChatCompletion('Error: Input image is needed. Please attach an image' , null, null)), res);
                await sleep(1000);
                endStream(res);
              } else {
                res.send(response);

              }

              updateLogs(body, response, userID);

              return;


            }

          }


  }

        if (agentData?.req_type !== null && agentData?.req_type === 'replicate' && agentData.llmrouter === 'upscalegen') {

          const inputImage = extractUrl(prompt);

          if (inputImage.startsWith('https://')) {

            const response = await upscaleGen(agentData.modelid, agentData.image_height, inputImage, agentData.lora);

            if (response) {
              console.log(response);
              if (body?.stream) {
                sendStream(JSON.stringify(createChatCompletion(response , null, null)), res);
                await sleep(1000);
                endStream(res);
              } else {
                res.send(response);

              }

              updateLogs(body, response, userID);

              return;


            } else {



              if (body?.stream) {
                sendStream(JSON.stringify(createChatCompletion('Error: Input image is needed. Please attach an image' , null, null)), res);
                await sleep(1000);
                endStream(res);
              } else {
                res.send(response);

              }

              updateLogs(body, response, userID);

              return;


            }

          }


  }

        if (agentData?.req_type !== null && agentData?.req_type === 'perplexity') {

              let response:any = null;

              try {

                const result:any = await textResponse(agentData, body.messages);
                console.log(result);
                response = result.data.choices[0].message.content;

                if (response) {

                  console.log(response);

                  if (body?.stream) {
                    sendStream(JSON.stringify(createChatCompletion(response , null, null)), res);
                    await sleep(1000);
                    endStream(res);
                  } else {
                    res.send(response);

                  }

                  // save data for logs.
                  updateLogs(body, response, userID);

                  return;


                }

              } catch (error) {
                  console.log('perplexity text gen issue', error);
              }


        }

        if (agentData?.req_type !== null && agentData?.req_type === 'openai') {

          let response:any = null;

          try {

                    if (agentData?.modelid && agentData?.modelid.startsWith('thread_')) {

                           response = await textResponseWithZep(agentData, body.messages);


                    } else

                    {
                          body.messages[body.messages.length -1].content =
                          [
                              {"type": "text", "text": prompt },
                              JSON.parse(extractUrls(prompt)),
                          ];

                            console.log(body.messages[body.messages.length -1].content );
                            const result  = await visionResponse(agentData?.llmrouter, body.messages);
                            response = result.choices[0].message.content;

                            // delete the uploaded image if it our S3.
                            body.messages[body.messages.length -1].content.filter((item: { type: string; image_url: { url: any; }; }) => item.type === 'image_url' && item.image_url?.url)
                              .map(async (item: { image_url: { url: string; }; }) => await deleteImageUrl(item.image_url.url));

                    }





            } catch (error) {

              console.log(error);

            }


          if (response) {

            console.log(response);

            if (body?.stream) {
              sendStream(JSON.stringify(createChatCompletion(response , null, null)), res);
              await sleep(1000);
              endStream(res);
            } else {
              res.send(response);

            }

            updateLogs(body, response, userID);

            return;


          }



        }

        if (agentData?.req_type !== null && agentData?.req_type === 'gputopia') {

          let response:any = null;

          try {

            response = await gputopia.chat.completions.create({
              model: "TheBloke/vicuna-7B-v1.5-GGUF:Q4_K_M",  // "TheBloke/vicuna-7B-v1.5-GGUF:Q4_K_M"
              messages: body.messages
            });

          } catch (error) {

            /*
            response = {

              choices: [ { index: 0, message: {role: 'assistant',
              content: "An error occured when accessing GPUtopia. instead, here is a joke to make you laugh. Why don't computers make good comedians? Because they can't handle a hard drive crash without losing their memory! "}, finish_reason: 'stop' } ]
            }

            */
            console.log(error);

          }



          if (response) {

            if (body?.stream) {
              sendStream(JSON.stringify(createChatCompletion(response.choices[0].message.content.trim() , null, null)), res);
              await sleep(1000);
              endStream(res);
            } else {
              res.send(response.choices[0].message.content.trim());

            }

            updateLogs(body, response.choices[0].message.content.trim(), userID);

            return;


          }



        }


        if (agentData?.req_type !== null && agentData?.req_type === 'randomseed') {

          if (agentData?.modelid === 'remove-background') {

            const response:backResponse = await removeBackground(extractUrl(prompt));

            if (!response || !response.image_url) response.image_url = 'With a roaring thunder, Image generation failed. To request refund, Please contact us on Discord. ';

            summaryTokens = response.image_url;

            if (body?.stream) {
              sendStream(JSON.stringify(createChatCompletion(response.image_url, null, null)), res);
              await sleep(1000);
              endStream(res);
            } else {
              res.send(response.image_url);

            }

              // save data for logs.
              updateLogs(body, response.image_url, userID);
            return;



          }

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
                  updateLogs(body,result.output.image_urls[0], userID);

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
                    updateLogs(body, response.output[0] , userID);


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

             // save data for logs.
            updateLogs(body, currentImageString, userID);

            await createNIP94Event(currentImageString, null, body.messages[body.messages.length -1].content);


          } catch (error) {

            console.log(error)
          }

          if (body?.stream) endStream(res);



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

    updateLogs(body, summaryTokens, userID);

    return;

  }

  const messages= getMessages(body.messages);

  console.log('Input prompt: ' + JSON.stringify(messages));

  if (body?.stream) {

        try {

          const stream = await openRouter.chat.completions.create({

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

          const questionStream = await openRouter.chat.completions.create({

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


        // end stream
        endStream(res);


  } else {

        try {

          const stream:any = await openRouter.chat.completions.create({

            messages,
            model: body.llm_router,
            max_tokens: body.max_tokens,
            stream: false,
            temperature: body.temperature

          });

          console.log('stream', stream)

          res.send(stream.choices[0].message.content);

          summaryTokens = stream.choices[0].message.content;


        } catch (error) {

          console.log(error);

          res.send('Error in getting response. Please try again later. ');

        }




  }


  updateLogs(body, summaryTokens, userID);

});

async function updateLogs(body:any, summaryTokens:string, userID:any) {

        // save data for logs.

        const userMessage = body.messages[body.messages.length -1].content;
        await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [body.messageId, body.conversationId,  body.app_fingerprint?body.app_fingerprint:uuidv4(), body.llm_router, body.system_purpose, userMessage.length > 2000?userMessage.substring(0,1998):userMessage,  summaryTokens, body, body]);

        const sessionId = body.app_fingerprint?body.app_fingerprint:uuidv4();
        const sessionData: ISession = {
          session_id: sessionId ,
          // user_id: userID.user_id, // Optionally associate this session with a user
          metadata: { agent: body.system_purpose,
                      createdDate: Date.now(),
                      userMessage: body.messages[body.messages.length -1].content,
                      llmResponse: summaryTokens },
        };
        const session = new Session(sessionData);

        try {

          await zepClient.memory.addSession(session);

        } catch (error) {

          await zepClient.memory.updateSession(session);

        }

        body.messages.push(
          {
            role: 'assistant',
            content: summaryTokens,
            metadata: { agent: body.system_purpose,
              createdDate: Date.now() }
          }


        )

        const messages = body.messages.map(
          ({ role, content, metadata }: MessageData) => new Message({ role, content, metadata })
       );

        const memory = new Memory({ messages });

        await zepClient.memory.addMemory(sessionId , memory);


}

export default l402;

interface MessageData {
  role: string;  // Assuming 'role' is of type string
  content: string;  // Replace with the appropriate type for 'content'
  metadata: {}
}



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