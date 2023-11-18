import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import  puppeteer from 'puppeteer';



const zepApiUrl =  process.env.ZEP_API_URL;
const collectionName = '41699669372';

const loader = new DirectoryLoader(
    "/Users/arunnedunchezian/Downloads/nips-master",
    {

      ".txt": (path) => new TextLoader(path),

    }
  );

  const loaderWithOptions2 = new PuppeteerWebBaseLoader("https://ltng.ventures", {
  launchOptions: {
    headless: true,
  },
  gotoOptions: {
    waitUntil: "domcontentloaded",
  },
});

    /*
  const loaderWithOptions = new PuppeteerWebBaseLoader(
    "https://www.tabnews.com.br/",
    {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
      /**  Pass custom evaluate , in this case you get page and browser instances
      async evaluate(page, browser) {
        //await page.waitForResponse("https://www.tabnews.com.br/");

        await page.setViewport({ width: 1680, height: 1050 });

        page.setJavaScriptEnabled(true);

        const result = await page.goto("https://ltng.ventures");

        console.log(result)
        await browser.close();
        return result;
      },
    }
  );
    */


async function checkDocs() {

    // const docs = await loader.load();
    // console.log({ docs });

    // const screenshot = await loaderWithOptions2.scrape();
    // console.log({ screenshot });

    // const docsFromLoaderWithOptions = await loaderWithOptions.load();
    // console.log({ docsFromLoaderWithOptions });

    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.goto('https://github.com/nostr-protocol/nips/blob/master/01.md');
        const pdf = await page.pdf({ path: '/Users/arunnedunchezian/Downloads/nip01.pdf'});

        await browser.close();
    })();


}

async function createCollection() {



    console.log(`Creating collection ${collectionName}`);

    const client = await ZepClient.init(zepApiUrl);


    const collection = await client.document.addCollection({
       name: collectionName,
       embeddingDimensions: 1536, // this must match the embedding dimensions of your embedding model
       description: "vivek2024 campaign", // optional
       metadata: { 'title': 'Vivek interview Youtube transacript' }, // optional
       isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
    });

    console.log(collection);

    uploadDocuments();

}


async function uploadDocuments() {

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);

    const docs = await loader.load();



    const documents = docs.map(
        (chunk) =>

           new Document({

              content: chunk.pageContent,
              // document_id: filename, // optional document ID used in your system
              metadata: chunk.metadata, // optional metadata
           })
        );

    console.log(docs);

    const uuids = await collection.addDocuments(documents);

    console.log(
        `Added ${uuids.length} documents to collection ${collectionName}`
     );

    await checkEmbeddingStatus(client, collectionName);

    await checkStatus();

    // Index the collection
    console.log(`Indexing collection ${collectionName}`);
    await collection.createIndex(true);

};

// createCollection();
// uploadDocuments();
// queryDocs();
checkDocs();

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