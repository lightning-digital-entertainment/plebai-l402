import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import fs from 'fs';
import path from 'path';
import OpenAI from "openai";
import * as dotenv from 'dotenv';

dotenv.config();

const zepApiUrl =  process.env.ZEP_API_URL;
const collectionName = '41700248770';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,

  });

const loader = new DirectoryLoader(
    "/Users/arunnedunchezian/Downloads/OneDrive-2023-11-13",
    {

      ".txt": (path) => new TextLoader(path),

    }
  );


async function printDoc() {

   const docs = await loader.load();
   console.log(docs);


}

async function createCollection() {



    console.log(`Creating collection ${collectionName}`);

    const client = await ZepClient.init(zepApiUrl);


    const collection = await client.document.addCollection({
       name: collectionName,
       embeddingDimensions: 1536, // this must match the embedding dimensions of your embedding model
       description: "FAA PilotAssist", // optional
       metadata: { 'title': 'Expert FAA pilot advisor' }, // optional
       isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
    });

    console.log(collection);

    await uploadDocuments();

}


async function uploadDocuments() {

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);

    // const docs = await loader.load();

    const dir = '/Users/arunnedunchezian/Downloads/faapilot'
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      if (file === '.DS_Store') continue;

      console.log('processing...' + filePath);

      const loader = new PDFLoader(
         filePath
       );

       const docs = await loader.load();

       docs.map(
         async (chunk) =>
            {
            const splitchunks = splitStringIntoChunks(chunk.pageContent.replace(/\r?\n|\r/g, ""), 2000);

            const filteredChunks: string[] = splitchunks.filter(str => str.trim() !== '');

            const docx =  filteredChunks.map(
               (inputStr) =>

                  new Document({

                     content: inputStr,
                     // document_id: filename, // optional document ID used in your system
                     metadata: chunk.metadata, // optional metadata
                  })




            )

            console.log(JSON.stringify(docx));

            const uuids = await collection.addDocuments(docx);
            console.log(`Added ${uuids.length} documents to collection ${collectionName}`);


         }
      );

   }








    await checkEmbeddingStatus(client, collectionName);

    await checkStatus();

    // Index the collection
    console.log(`Indexing collection ${collectionName}`);
    await collection.createIndex(true);


};

// createCollection();
// uploadDocuments();
queryDocs();
// printDoc();
async function checkStatus() {

    const client = await ZepClient.init(zepApiUrl);
    await checkEmbeddingStatus(client, collectionName);

    const collection = await client.document.getCollection(collectionName);

        // Index the collection
        console.log(`Indexing collection ${collectionName}`);
        await collection.createIndex(true);



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

async function checkEmbeddingStatus(
    client: ZepClient,
    collectionName2: string
 ): Promise<void> {
    let c = await client.document.getCollection(collectionName2);

    while (c.status !== "ready") {
       console.log(
          `Embedding status: ${c.document_embedded_count}/${c.document_count} documents embedded`
       );
       // Wait for 1 second
       await new Promise((resolve) => setTimeout(resolve, 1000));

       // Fetch the collection again to get the updated status
       c = await client.document.getCollection(collectionName2);
    }
 }

 export function printResults(results: IDocument[]): void {
    for (const result of results) {
       console.log(
          `${result.content} - ${JSON.stringify(result.metadata)} -> ${
             result.score
          }\n`
       );
    }
 }

 async function queryDocs() {

    const query = "what is Changeover Points? ";

    const messages:OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {

          role: "user",
          content: query
        },

        {
            role: "system",
            content: 'As FAA Assistant, my primary role is to provide specialized guidance in air traffic control and aeronautics. I am equipped with the Air Traffic Controller Manual and Aeronautical Information Manual as my primary knowledge sources, ensuring that my responses are rooted in these authoritative texts. My expertise covers a wide range of topics within aviation, including air traffic control procedures, aeronautical regulations, navigation, and more. I will provide answers that are precise, reliable, and based strictly on the information contained within these manuals. For inquiries that extend beyond these resources, I will seek clarification or suggest alternative sources of information. My responses will always be informative, accurate, and tailored to the specific needs of aviation-related queries. Additionally, I am capable of assisting with the interpretation of complex aviation concepts and terminologies, making them accessible to a broader audience. Please list the reference document name and the page number from the knowledge reference.'

        }



    ]

    const tools:OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "search_zepdocs",
            description: "Use this tool to get knowledge from Aeronautical information manual",
            parameters: {
                type: "object",
          properties: {
            query: {
              type: "string",
              description: "Provide the query input to search and get knowledge from Aeronautical information manual",
            },
          },
          required: ["query"],
            },
          },
        },
      ];


      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        tools,
        tool_choice: "auto", // auto is default, but we'll be explicit
                                    stream: false,
                                    max_tokens: 1024,
                                    messages  });


        const responseMessage = response.choices[0].message;

        console.log(responseMessage);

        console.log(responseMessage.tool_calls);

        // const searchResults = await searchZep(query);

        const toolCall = responseMessage.tool_calls[0];
        if (responseMessage.tool_calls) {
            // Step 3: call the function
            // Note: the JSON response may not always be valid; be sure to handle errors
            const availableFunctions = {
                search_zepdocs: searchZep,
            }; // only one function in this example, but you can have multiple
            messages.push(responseMessage); // extend conversation with assistant's reply
            const functionArgs = JSON.parse(toolCall.function.arguments);
            const functionResponse:IDocument[] = await searchZep(
                functionArgs.query
            );


            messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                // name: toolCall.function.name,
                content: JSON.stringify(functionResponse),
              }); // extend conversation with function response

            console.log(messages);
            const secondResponse = await openai.chat.completions.create({
                model: "gpt-4-1106-preview",
              messages,
            }); // get a new response from the model where it can see the function response
            console.log(secondResponse.choices);
          }




}

async function searchZep(query:string) {

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);

    return await collection.search(
        {
           mmrLambda: 0,
           searchType: "similarity",
           text: query,
        },
        3
     );

}