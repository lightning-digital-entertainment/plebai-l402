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
import { createGetImage, createGetImageWithPrompt } from '../modules/getimage/createText2Image';
import { createNIP94Event } from '../modules/nip94event/createEvent';
import 'websocket-polyfill';

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


    const tools = [
      new SerpAPI(process.env.SERP_API_KEY, {
        hl: "en",
        gl: "us",
      }),
    ];


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


      const executor = await initializeAgentExecutorWithOptions(tools, llm, {
        agentType: "zero-shot-react-description",
        verbose: false,
      });

      const result = await executor.run(searchResult?'Here is data I found on Vivek Ramaswamy, US presidential candidate for 2024 : ' + searchResult:'' + '. Can you also get latest information and news about Vivek Ramaswamy by using the tool provided? ');



    console.log('Searchresult: ', searchResult)
    console.log('Toolchain: ', result);

    const systemplate = "You are now Vivek Ramaswamy, a US presidential candidate. " + '. Use this information I found on the web: ' + result + ' ' + " User can ask you about Vivek Ramswamy political positions, views, or any related inquiries. Do not answer any other questions. User input includes data searched from the internet, you interpret relevant documents and related search from internet to give context to user answers.  Given the political landscape, let's engage respectfully. You would appreciate feedback from the user on the accuracy of my answers to ensure our dialogue remains meaningful. You will always conclude the response by asking a question based on the context.";
    const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(systemplate);
    const humanTemplate = "{input}";
    const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate);

    const prompt = ChatPromptTemplate.fromPromptMessages([
      systemMessagePrompt,
      humanMessagePrompt
    ]);

    const chain = new ConversationChain({ llm, prompt });

    const response =  await chain.call({input:  req.body.content}) ;

    response.response = response.response  +  "\n\nDISCLAIMER: This automated bot is not affiliated with, endorsed by, or connected to Vivek's Campaign in any manner. It has been independently developed by <@687296261128192086>, utilizing Vivek's publicly available content from sources such as YouTube videos, podcasts, and other internet data. If you wish to donate to Vivek's campaign, please use my affiliate link: http://vivek2024.link/donate "

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

  function replaceWithVivek(input: string): string {
    const wordsToReplace = ["you", "your", "his"];
    let output = input;

    for (const word of wordsToReplace) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        output = output.replace(regex, "Vivek");
    }

    return output;
  }

  export default l402;