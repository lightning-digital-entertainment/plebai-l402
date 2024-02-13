import { JSONLoader } from "langchain/document_loaders/fs/json";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import * as dotenv from 'dotenv';

dotenv.config();
const zepApiUrl =  process.env.ZEP_API_URL;
const collectionName = '41700794059';

const loader = new JSONLoader('/Users/arunnedunchezian/Downloads/relai.json');



async function createCollection() {



    console.log(`Creating collection ${collectionName}`);

    const client = await ZepClient.init(zepApiUrl);


    const collection = await client.document.addCollection({
       name: collectionName,
       embeddingDimensions: 1536, // this must match the embedding dimensions of your embedding model
       description: "Strike App resources ", // optional
       metadata: { 'title': "Strike App FQAs" }, // optional
       isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
    });

    console.log(collection);

    await uploadDocuments();

}

async function checkGitbook() {


    const docs = await loader.load();

    console.log(docs);
}

async function uploadDocuments() {

    const client = await ZepClient.init(zepApiUrl, process.env.ZEP_API_KEY);
    const collection = await client.document.getCollection(collectionName);

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

    await checkEmbeddingStatus(client, collectionName);

    // Index the collection
    console.log(`Indexing collection ${collectionName}`);
    await collection.createIndex(true);

};

// createCollection();
// uploadDocuments();
// checkStatus();
// checkGitbook();
queryDocs();

async function checkStatus() {

    const client = await ZepClient.init(zepApiUrl);
    await checkEmbeddingStatus(client, collectionName);

    const collection = await client.document.getCollection(collectionName);

        // Index the collection
        console.log(`Indexing collection ${collectionName}`);
        await collection.createIndex(true);



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

    const client = await ZepClient.init(zepApiUrl, process.env.ZEP_API_KEY);
    const collection = await client.document.getCollection(collectionName);



    const query = "How do I use replai app? ";
    const searchResults = await collection.search(
       {
          text: query,
       },
       3
    );
    console.log(
       `Found ${searchResults.length} documents matching query '${query}'`
    );
    printResults(searchResults);

    const newSearchResults = await collection.search(
        {
           text: query
        },
        3
     );
     console.log(
        `Found ${newSearchResults.length} documents matching query '${query}'`
     );
     printResults(newSearchResults);





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