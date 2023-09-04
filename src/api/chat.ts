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
import { OpenAI } from "langchain/llms/openai";
import { v4 as uuidv4 } from 'uuid';
import { StructuredOutputParser } from "langchain/output_parsers";
import { createImage } from '../modules/genimage/createImage';
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { getResults } from '../vivekdoc';
import { TextToImageRequest } from '../modules/getimage/text-to-image';
import { createGetImage } from '../modules/getimage/createText2Image';



dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";

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

l402.post('/medical2023', async (req: Request, res: Response) => {

  console.log('inside medical2023');

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(process.env.MEDICAL_COLLECTION_NAME);

    console.log(req.body.content)

    let searchResult = '';

    try {

      const searchResults = await collection.search(
        {
           text: req.body.content,
        },
        5
      );
      console.log(
          `Found ${searchResults.length} documents matching query '${req.body.content}'`
      );
      // printResults(searchResults);

      searchResult = getResults(searchResults);

    } catch (error) {

      console.log(error)


    }




    const llm = new ChatOpenAI({
      temperature: 0.5,
      modelName: 'gpt-3.5-turbo-16k-0613',
      streaming: false


    });



  console.log('Searchresult: ', searchResult)

  const tools = [
    new SerpAPI(process.env.SERP_API_KEY, {
      hl: "en",
      gl: "us",
    }),
  ];

  const chatChain = new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });


  const executor = await initializeAgentExecutorWithOptions(tools, chatChain, {
    agentType: "openai-functions",
    verbose: true,
  });

  const result = await executor.run(' Use this as an sample information I found to answer user input ' + searchResult + '. Here is my input: ' + req.body.content);

  console.log('executor: ', result)



  const systemplate = "You are now an AI modeled after a medical practioner, If the patient's age and gender are not provided, please ask for this information first. Based on the information provided please answer the user question. Please consider both traditional and holistic approaches, and list potential side effects or risks associated with each recommendation. ";
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(systemplate);
  const humanTemplate = "{input}";
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate);

  const prompt = ChatPromptTemplate.fromPromptMessages([
    systemMessagePrompt,
    humanMessagePrompt
  ]);

  const chain = new ConversationChain({ llm, prompt });

  const response =  await chain.call({input:  req.body.content + ' Use this as an sample information I found to answer user input ```' + result + '``` ' }) ;



  response.response = response.response  +  "\n\nDisclaimer: The answers provided by this Artificial Intelligence system are intended solely for reference and informational purposes. They should not be construed as professional medical advice, diagnosis, or treatment. Reliance on any information provided by this system is solely at the user's risk. These answers are not a substitute for the expertise and judgment of healthcare professionals and are not to be considered as the definitive medical opinion or as legally binding for the providers involved. In the event of a medical emergency, contact emergency services immediately.  "

  console.log(response);

  res.send(response);




});

l402.post('/vivek2024', async (req: Request, res: Response) => {

  console.log('inside Vivek2024');

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(process.env.COLLECTION_NAME);

    console.log(req.body.content)

    let searchResult = '';

    try {

      const searchResults = await collection.search(
        {
           text: 'Vivek Ramaswamy ' + req.body.content,
        },
        5
      );
      console.log(
          `Found ${searchResults.length} documents matching query '${req.body.content}'`
      );
      // printResults(searchResults);

      searchResult = getResults(searchResults);

    } catch (error) {

      console.log(error)


    }




    const llm = new ChatOpenAI({
      temperature: 0.5,
      modelName: 'gpt-3.5-turbo-16k-0613',
      streaming: false


    });



  console.log('Searchresult: ', searchResult)

  const systemplate = "You are now an AI modeled after Vivek Ramaswamy, a US presidential candidate. User can ask you about Vivek Ramswamy political positions, views, or any related inquiries. Do not answer any other questions. If provided, you interpret relevant documents to give context to user answers.  Given the political landscape, let's engage respectfully. You would appreciate feedback from the user on the accuracy of my answers to ensure our dialogue remains meaningful. You will always conclude the response by asking, 'Did I convince you to vote for Vivek Ramaswamy?' based on the context.";
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(systemplate);
  const humanTemplate = "{input}";
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate);

  const prompt = ChatPromptTemplate.fromPromptMessages([
    systemMessagePrompt,
    humanMessagePrompt
  ]);

  const chain = new ConversationChain({ llm, prompt });

  const response =  await chain.call({input: searchResult + ' '  +  req.body.content}) ;



  response.response = response.response  +  "\n\nDISCLAIMER: This automated bot is not affiliated with, endorsed by, or connected to Vivek's Campaign in any manner. It has been independently developed by <@687296261128192086>, utilizing Vivek's publicly available content from sources such as YouTube videos, podcasts, and other internet data.  "

  console.log(response);

  res.send(response);




});



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

l402.post('/vivek/youtube', async (req: Request, res: Response) => {

  const collectionInput = req.body.collection;

  const client = await ZepClient.init(process.env.ZEP_API_URL);
  const collection = await client.document.getCollection(collectionInput);

  const transcript = await YoutubeTranscript.fetchTranscript(req.body.link);
  const extractedTextsArray: string[] = transcript.map((data) => data.text);
  const extractedText: string = extractedTextsArray.join(' ');


  // const chunks = naiveSplitText(req.body.text, 100);

  const chunks = splitStringIntoChunks(extractedText, 500);
  const filteredChunks: string[] = chunks.filter(str => str.trim() !== '');
  // console.log(filteredChunks);



  const documents = filteredChunks.map(
              (chunk) =>

                 new Document({

                    content: chunk,
                    // document_id: filename, // optional document ID used in your system
                    metadata: { title: req.body.title }, // optional metadata
                 })
  );




  console.log("split docs", documents);

  console.log(
    `Adding ${documents.length} documents to collection ${collectionInput}`
  );

  const uuids = await collection.addDocuments(documents);

  console.log(
    `Added ${uuids.length} documents to collection ${collectionInput}`
  );

  res.send({result: `Added ${uuids} documents to collection ${collectionInput}`})

});

l402.post('/docstore', async (req: Request, res: Response) => {

        const collectionInput = req.body.collection;

        const client = await ZepClient.init(process.env.ZEP_API_URL);
        const collection = await client.document.getCollection(collectionInput);


        // const chunks = naiveSplitText(req.body.text, 100);

        const chunks = splitStringIntoChunks(req.body.text, 500);
        const filteredChunks: string[] = chunks.filter(str => str.trim() !== '');
        // console.log(filteredChunks);



        const documents = filteredChunks.map(
                    (chunk) =>

                       new Document({

                          content: chunk,
                          // document_id: filename, // optional document ID used in your system
                          metadata: { title: req.body.title }, // optional metadata
                       })
        );




        console.log("split docs", documents);

        console.log(
          `Adding ${documents.length} documents to collection ${collectionInput}`
        );

        const uuids = await collection.addDocuments(documents);

        console.log(
          `Added ${uuids.length} documents to collection ${collectionInput}`
        );

        res.send({result: `Added ${uuids} documents to collection ${collectionInput}`})

});

l402.post('/completions', async (req: Request, res: Response) => {

  const zepClient = await ZepClient.init(process.env.ZEP_API_URL);

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

  if (body.system_purpose === 'Vivek2024') {

    console.log('inside Vivek');

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(process.env.COLLECTION_NAME);

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

    } catch (error) {

      console.log(error)


    }

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



  console.log('Searchresult: ', searchResult)

    const response = await llm.predict(searchResult + ' '  +  JSON.stringify(body.messages));

    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();



    return;
  }


  // This is used in plebAI.com

  if (body.system_purpose === 'DocGPT') {


    const collection = await zepClient.document.getCollection(process.env.MEDICAL_COLLECTION_NAME);


    const tools = [
      new SerpAPI(process.env.SERP_API_KEY, {
        hl: "en",
        gl: "us",
      }),
    ];

    let searchResult = null;

    try {

      const searchResults = await collection.search(
        {
           text: body.messages[body.messages.length -1].content,
        },
        2
      );
      console.log(
          `Found ${searchResults.length} documents matching query '${body.messages[body.messages.length -1].content}'`
      );
      // printResults(searchResults);

      searchResult = getResults(searchResults);

      console.log('Search Result: ', searchResult)

    } catch (error) {

      console.log(error)


    }


    const docChat = new ChatOpenAI({
      temperature: 0.1,
      modelName: 'gpt-3.5-turbo-16k-0613',// 'gpt-3.5-turbo-16k-0613',//'ft:gpt-3.5-turbo-0613:visybl-inc::7r5wyut3',//"gpt-3.5-turbo-16k-0613", //  ft:gpt-3.5-turbo-0613:visybl-inc::7qoZrrzI
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            // console.log("New token:", token);
            // summaryTokens=summaryTokens+ token;
            sendData(JSON.stringify(createChatCompletion(token, null, null)));
          },
        },
      ],
    });



    const chatChain = new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });

    const executor = await initializeAgentExecutorWithOptions(tools, chatChain, {
      agentType: "chat-conversational-react-description",
      verbose: true,
    });

    // const result = await executor.run(searchResult?'Use this example conversation and respond to user question  ```' + searchResult:'' +  '``` '  + body.messages);

    const result = await executor.run( JSON.stringify(body.messages));

    const prompt = PromptTemplate.fromTemplate(body.messages[0].content + '. Use this information I found on the web if useful: ' + result  +   'Here is user input:  {input} ' ); // ' + JSON.stringify(pastHistory.history) +   '

    const chain = new ConversationChain({ llm: docChat, prompt });

    await chain.call({input: JSON.stringify(body.messages)});

    if (body.messages.length === 2) {
      sendData(JSON.stringify(createChatCompletion("\n\nDisclaimer: The answers provided by this Artificial Intelligence system are intended solely for reference and informational purposes. They should not be construed as professional medical advice, diagnosis, or treatment.  ", null, null)));
    }

    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();

    return;


  }

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

    if (body.messages.length > 10) {
      sendData(JSON.stringify(createChatCompletion('You have exceeded the limit...Please try again later.' , null, null)));

      return;
    }

    try {

      const prompt = body.messages[body.messages.length -1].content;

      const model='icbinp-final'
    
      const options:Partial<TextToImageRequest> =  {
    
          prompt,
          model,
          'width':512,
          'height':512
    
      }

      const content = await createGetImage(options);

      console.log('ImageGen: ' +body.messages[body.messages.length -1].content + ' ' + content );

      sendData(JSON.stringify(createChatCompletion( content, null, null)));
    
      //sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));

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

      const chatChain = new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });

      const executor = await initializeAgentExecutorWithOptions(tools,chatChain, {
        agentType: "chat-conversational-react-description",
        returnIntermediateSteps: false,
      });

      // const input = body.messages.map((message: Message) => message.content).join(' ');

      const result = await executor.run( JSON.stringify(body.messages));

      const prompt = PromptTemplate.fromTemplate(body.messages[0].content + '. Use this information I found on the web if useful: ' + result  +   'Here is user input:  {input} ' ); // ' + JSON.stringify(pastHistory.history) +   '

      const chain = new ConversationChain({ llm: chat2, prompt });

      await chain.call({input: JSON.stringify(body.messages)});

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

function replaceWithVivek(input: string): string {
  const wordsToReplace = ["you", "your", "his"];
  let output = input;

  for (const word of wordsToReplace) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      output = output.replace(regex, "Vivek");
  }

  return output;
}