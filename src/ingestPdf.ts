import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import * as dotenv from 'dotenv';

dotenv.config();
const collectionName = 'airmen2';

const loader = new PDFLoader("/Users/arunnedunchezian/Downloads/faapilot/airplane-flying.pdf");
const zepApiUrl = process.env.ZEP_API_URL;
let zepClient: any;
zepClient = ZepClient.init(process.env.ZEP_API_URL, process.env.ZEP_API_KEY)
                      .then(resolvedClient => {
                        zepClient = resolvedClient
                          console.log('Connected to Zep...')
                      })
                      .catch(error => {
                          console.log('Error connecting to Zep')
                      });

async function createCollection() {

   const client = await ZepClient.init(zepApiUrl, process.env.ZEP_API_KEY);

    console.log(`Creating collection ${collectionName}`);


   try {

      const collection = await client.document.addCollection({
         name: collectionName,
         embeddingDimensions: 768, // this must match the embedding dimensions of your embedding model
         description: "pilot Airmen testing, faqs", // optional
         metadata: { 'title': 'pilot Airmen testing, faqs' }, // optional
         isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
      });

      console.log(collection);

   } catch (error) {
      console.log(error);
   }



    await uploadDocuments();

}


async function uploadDocuments() {


    const collection = await zepClient.document.getCollection(collectionName);

    const docs = await loader.load();



    const documents = docs.map(
        async (chunk) => {
                  const docpage = new Document({

                     content: chunk.pageContent,
                     // document_id: filename, // optional document ID used in your system
                     metadata: chunk.metadata, // optional metadata
                  })

                  /* const uuids = await collection.addDocuments(docpage);

                  console.log(
                     `Added ${uuids.length} documents to collection ${collectionName}`
                  ); */

                  console.log(docpage);

                  await sleep(2000);


        }


        );





    await checkEmbeddingStatus(zepClient, collectionName);

    await checkStatus();

    // Index the collection
    console.log(`Indexing collection ${collectionName}`);
    await collection.createIndex(true);

};

createCollection();
// uploadDocuments();
// queryDocs();

async function checkStatus() {


    await checkEmbeddingStatus(zepClient, collectionName);

    const collection = await zepClient.document.getCollection(collectionName);

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

 function sleep(ms: number) {
   return new Promise((resolve) => {
     setTimeout(resolve, ms);
   });
 }

 async function queryDocs() {

   const client = await ZepClient.init(zepApiUrl, process.env.ZEP_API_KEY);
    const collection = await client.document.getCollection(collectionName);



    const query = "pet policy ";
    const searchResults = await collection.search(
       {
          text: query,
          searchType: "mmr",
          mmrLambda: 0.5,
       },
       3,

    );
    console.log(
       `Found ${searchResults.length} documents matching query '${query}'`
    );
    printResults(searchResults);




}