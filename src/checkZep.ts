import { JSONLoader } from "langchain/document_loaders/fs/json";
import { Document, IDocument,ZepClient } from "@getzep/zep-js";



const zepApiUrl =  'http://107.21.5.87:7999'; // process.env.ZEP_API_URL;
const collectionName = 'db1701037572';


export function printResults(results: IDocument[]): void {
    for (const result of results) {
       console.log(
          `${result.content} - ${JSON.stringify(result.metadata)} -> ${
             result.score
          }\n`
       );
    }
 }



queryDocs();

 async function queryDocs() {

    const client = await ZepClient.init(zepApiUrl);
    const collection = await client.document.getCollection(collectionName);



    const query = "list their portfolio companies? ";
    const searchResults = await collection.searchReturnQueryVector(
       {
          text: query,
       },
       3
    );
    console.log(
       `Found ${searchResults.length} documents matching query '${query}'`
    );

    console.log(JSON.stringify(searchResults));
    // printResults(searchResults);

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


