import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import fs from 'fs';
import path from 'path';



const zepApiUrl =  process.env.ZEP_API_URL;
const collectionName = '4169997295210';

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
       description: "Asesor Bancario", // optional
       metadata: { 'title': 'Expert advisor on banking regulations in El Salvador' }, // optional
       isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
    });

    console.log(collection);

    await uploadDocuments();

}


async function uploadDocuments() {

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);

    // const docs = await loader.load();

    const dir = '/Users/arunnedunchezian/Downloads/bancario'
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      console.log('processing...' + filePath);

      const loader = new DocxLoader(
         filePath
       );

       const docs = await loader.load();

       docs.map(
         async (chunk) =>
            {
            const splitchunks = splitStringIntoChunks(chunk.pageContent.replace(/\r?\n|\r/g, ""), 800);

            const filteredChunks: string[] = splitchunks.filter(str => str.trim() !== '');

            const docx =  filteredChunks.map(
               (inputStr) =>

                  new Document({

                     content: inputStr,
                     // document_id: filename, // optional document ID used in your system
                     metadata: chunk.metadata, // optional metadata
                  })




            )

            // console.log(docx);

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

createCollection();
// uploadDocuments();
// queryDocs();
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

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);



    const query = "How do I install the Alby Browser Extension? ";
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