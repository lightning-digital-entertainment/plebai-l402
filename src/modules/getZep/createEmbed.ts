import { Document, DocumentCollection, ZepClient } from "@getzep/zep-js";
import { getAgentById, updateTable } from "../../api/data";
import { GitbookLoader } from "langchain/document_loaders/web/gitbook";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import {unlink, existsSync } from 'fs';
import * as dotenv from 'dotenv';
import {exec } from 'child_process';

dotenv.config();


const zepApiUrl = process.env.ZEP_API_URL;



export async function createZepEmbeddings(agentId: string) {

        console.log(zepApiUrl);

        const client = await ZepClient.init(zepApiUrl, process.env.ZEP_API_KEY);

        const collectionName = agentId.slice(-12);
        const agentData:any = await getAgentById(agentId);

        const collection = await getCollection(collectionName, client, agentData);

        const dataSource:any[] = agentData.datasource.datasource;

        const updatedDataSource:any[] = agentData.datasource.datasource;



        dataSource.map(
            async (row) => {
                let filename:string = '';

                if (!row.status && row.type === 'url') {

                    let cmd = '/home/ubuntu/.nvm/versions/node/v19.2.0/bin/node /home/ubuntu/gpt-crawler/dist/src/cli.js -u "url/" -a "url/**" -o /home/ubuntu/plebai-l402/upload/name.json -m 50 -s "/"';
                    cmd = cmd.replace(new RegExp('url', 'g'), row.data).replace('name', collectionName+row.id);
                    console.log(cmd);
                    const result = await executeCommand(cmd); // Replace 'ls' with your command
                    console.log(result);

                    filename=collectionName+row.id+'.json';


                } else {

                    filename=row.data;
                }
                if (!row.status && existsSync(process.env.UPLOAD_PATH +filename)) {

                    console.log(process.env.UPLOAD_PATH +filename);
                    let docs: any[];
                    switch (row.type) {
                        case "gitbook": {

                            const loader = new GitbookLoader(process.env.UPLOAD_PATH +filename, {
                                    shouldLoadAllPaths: true,
                            });

                            docs = await loader.load();
                            break;
                        }
                        case "docs": {

                            if (filename.substring(filename.lastIndexOf(`.`)+1) === 'txt') {

                                const loader = new TextLoader(process.env.UPLOAD_PATH +filename);
                                docs = await loader.load();

                            } else if (filename.substring(filename.lastIndexOf(`.`)+1) === 'docx') {
                                const loader = new DocxLoader(process.env.UPLOAD_PATH +filename);
                                docs = await loader.load();

                            }
                            break;

                        }
                        case "pdf": {
                            console.log('inside PDF');


                            const loader = new PDFLoader(process.env.UPLOAD_PATH +filename);
                            docs = await loader.load();
                            break;

                        }
                        case "json": {

                            const loader = new JSONLoader(process.env.UPLOAD_PATH +filename);
                            docs = await loader.load();
                            break;
                        }
                        case "url": {

                            const loader = new JSONLoader(process.env.UPLOAD_PATH +filename);
                            docs = await loader.load();
                            break;
                        }
                        default: {
                            console.log('In default');
                            break;
                        }
                    }



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

                // delete the source file
                unlink(process.env.UPLOAD_PATH +filename, (err) => {
                    if (err) {
                        console.log(err);
                    }
                  console.log('tmp file deleted');
                })

                updatedDataSource[row.id].status = true;
                console.log('Updated datasource: ', JSON.stringify(updatedDataSource)  );

                const data = {

                    id:agentData.id,
                    datasource: {datasource: updatedDataSource},
                    collectionname: collectionName,
                    getzep: true

                }

                const result = await updateTable(data);

                console.log('Update table status: ', result);
                /*
                const result = await fetch('http://localhost:5004' + '/v1/data/agent/update', {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                })
                */

                console.log(result);


                }
            }


        );








}




async function getCollection(collectionName:string, client:ZepClient, agentData:any):Promise<DocumentCollection> {

    try {

        const collection = await client.document.getCollection(collectionName);

        if (collection) return collection;

    } catch (error) {

        console.log(`Creating collection ${collectionName}`);

        const collection = await client.document.addCollection({
                name: collectionName,
                embeddingDimensions: 1536, // this must match the embedding dimensions of your embedding model
                description: agentData.description, // optional
                metadata: { 'title': agentData.title }, // optional
                isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
        });

        if (collection) return collection;


    }

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


function executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
}

