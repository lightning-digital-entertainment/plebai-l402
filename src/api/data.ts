import { Request, Response, Router } from 'express';
import { SystemPurposes } from '../modules/data';
import {Client} from 'pg'
import { SystemPurposeData } from '../modules/data';
import { errorBadAuth, getImageUrl } from '../modules/helpers';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync } from 'fs'
import { setTimeout } from 'timers/promises';
import { Model, getModels } from '../modules/randomseed/txt2img';
import { createZepEmbeddings } from '../modules/getZep/createEmbed';
import { createNostrUser } from '../modules/nostr/createuser';



const data = Router();

dotenv.config();

const pubkey = async (nip05: string):Promise<string> => {

        try {

                const [username, hostname] = nip05.split('@');
                const invoiceResponse = await fetch('https://' + hostname + '/.well-known/nostr.json?name=' + encodeURIComponent(username), {method: 'GET'});
                const responseJson = await invoiceResponse.json();
                return responseJson?.names[username]?responseJson?.names[username]:''

        } catch (error) {

                console.log(error)
                return ''

        }



}

const cn = {
        host: process.env.DBHOST,
        port: 5432,
        database: process.env.DBNAME,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        poolSize: 20,
        ssl: {rejectUnauthorized: false,}
      }

      const pgclient = new Client(cn);
      let pgupdate=false;

      pgclient.connect((err) => {
        if (err) {
          console.error('pg connection error', err.stack)
          pgupdate=false;
        } else {
          console.log('pg client is connected')
          pgupdate=true;
        }
      });


data.post('/upload', async (req: Request, res: Response) => {

        try {

                const id = uuidv4();
                const fileString = req.body.input;
                writeFileSync( process.env.UPLOAD_PATH + id + `.` + req.body.type, fileString.split(",")[1], 'base64')
                if (req.body.type === 'jpeg' || req.body.type === 'png' || req.body.type === 'jpg')  {

                        const response =  await getImageUrl(id, req.body.type);
                        console.log(response);
                        res.send(({'url' : response}))
                } else {
                        console.log(process.env.UPLOAD_PATH + id + `.` + req.body.type);
                        res.send(({'url' : id + `.` + req.body.type}))

                }


        } catch (error) {
                res.send({'error' : true})
        }


});
data.post('/agents', async (req: Request, res: Response) => {

        console.log(req.body);

        if (!pgupdate) {
                res.send({SystemPurposes})

        } else {
                const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, nip05, category, restricted, CASE WHEN createtime < NOW() - INTERVAL '4 day' THEN 'false' ELSE 'true' END AS newagent, datasource, req_type, iresearch FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY CASE WHEN createdby = '"+ req.body.fingerPrint + "' THEN 0 ELSE 1 END, CASE WHEN createtime >= (current_timestamp - interval '2 day') THEN 0 ELSE 1 END, chatruns DESC; ");
                // const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, category  FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY chatruns DESC;" );
                const agentData: { [x: string]: { title: any; description: any; systemMessage: any; symbol: any; examples: any; placeHolder: any; chatLLM: any; llmRouter: any; convoCount: any; maxToken: any; temperature: any; satsPay: any; paid: any; private: any; status: any; createdBy: any; updatedBy: any; chatruns: number; newAgent: boolean, nip05:string, category:string, restricted:boolean, datasource:string, reqType:string, iresearch:boolean }; }[] = [];
                const dataOutput: { [key: string]: any } = {};
                if (result.rows) {

                        result.rows.filter(async item => {
                                // const getPubkey = await pubkey(item.nip05);

                                agentData.push({
                                        [item.id]: {
                                                title: item.title,
                                                description: item.description,
                                                systemMessage: item.systemmessage,
                                                symbol: item.symbol,
                                                examples: item.examples,
                                                placeHolder: item.placeholder,
                                                chatLLM: item.chatllm,
                                                llmRouter: item.llmrouter,
                                                convoCount: item.convocount,
                                                maxToken: item.maxtoken,
                                                temperature: item.temperature,
                                                satsPay: item.satspay,
                                                paid: item.paid,
                                                private: item.private,
                                                status: item.status,
                                                createdBy: item.createdby,
                                                updatedBy: item.updatedby,
                                                chatruns: item.chatruns,
                                                newAgent: item.newagent,
                                                nip05: item.nip05,
                                                category: item.category,
                                                restricted: item.restricted,
                                                iresearch: item.iresearch,
                                                reqType: item.req_type,
                                                datasource: item.datasource

                                        },

                                });




                        });
                        // console.log(agentData)   ;
                        agentData.forEach(item => {
                                const key = Object.keys(item)[0];
                                dataOutput[key] = item[key];
                            });

                        res.send({SystemPurposes: dataOutput});
                }


        }

});

data.get('/prompts/:id/:limit/:offset', async (req: Request, res: Response) => {
        console.log(req.params);
        const result = await pgclient.query("select message_id, agent_type, user_message, response from messages where response <> '' and agent_type = '" + req.params.id + "' order by feedback_type DESC, created_on DESC limit " +  req.params.limit + " offset " +  req.params.offset + ";  ");
        res.send(result.rows)

});

data.get('/agent/name/:name', async (req: Request, res: Response) => {
        console.log(req.params);
        const name = decodeURIComponent(req.params.name);
        console.log(name);
        const result = await pgclient.query("select id, title from aiagents where title = '" + name + "' ");
        if (result?.rows?.length === 0) {
                res.send({status: false});
        } else {
                res.send({status: true});
        }

});

data.get('/models', async (req: Request, res: Response) => {

        const getModelData:Model[] = await getModels();

        res.send({getModelData});

});
data.post('/agents/all', async (req: Request, res: Response) => {

        console.log(req.body);

        if (!pgupdate) {
                res.send({SystemPurposes})

        } else {
                const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, CASE WHEN createtime < NOW() - INTERVAL '2 day' THEN 'false' ELSE 'true' END AS newagent, key_iv, key_content, nip05, datasource, req_type, iresearch FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY CASE WHEN createdby = '"+ req.body.fingerPrint + "' THEN 0 ELSE 1 END, CASE WHEN createtime >= (current_timestamp - interval '2 day') THEN 0 ELSE 1 END, chatruns DESC; ");
                // const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns  FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY chatruns DESC;" );
                const agentData: { [x: string]: { title: any; description: any; systemMessage: any; symbol: any; examples: any; placeHolder: any; chatLLM: any; llmRouter: any; convoCount: any; maxToken: any; temperature: any; satsPay: any; paid: any; private: any; status: any; createdBy: any; updatedBy: any; chatruns: number; newAgent: boolean, key_iv:string, key_content:string, nip05:string, datasource:string, reqType:string, iresearch:boolean  }; }[] = [];
                const dataOutput: { [key: string]: any } = {};
                if (result.rows) {
                        result.rows.filter(item => {

                                agentData.push({
                                        [item.id]: {
                                                title: item.title,
                                                description: item.description,
                                                systemMessage: item.systemmessage,
                                                symbol: item.symbol,
                                                examples: item.examples,
                                                placeHolder: item.placeholder,
                                                chatLLM: item.chatllm,
                                                llmRouter: item.llmrouter,
                                                convoCount: item.convocount,
                                                maxToken: item.maxtoken,
                                                temperature: item.temperature,
                                                satsPay: item.satspay,
                                                paid: item.paid,
                                                private: item.private,
                                                status: item.status,
                                                createdBy: item.createdby,
                                                updatedBy: item.updatedby,
                                                chatruns: item.chatruns,
                                                newAgent: item.newagent,
                                                key_iv: item.key_iv,
                                                key_content: item.key_content,
                                                nip05: item.nip05,
                                                iresearch: item.iresearch,
                                                reqType: item.req_type,
                                                datasource: item.datasource
                                        },

                                });




                        });

                        agentData.forEach(item => {
                                const key = Object.keys(item)[0];
                                dataOutput[key] = item[key];
                            });
                        res.send({SystemPurposes: dataOutput});
                }


        }

});



data.post('/agent', async (req: Request, res: Response) => {

        console.log(req.body);

        if (!req.body?.id) res.send({error: 'ai agent not found'})

        if (!pgupdate) {
                res.send({error: 'ai agent not found'})

        } else {
                const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, category, commissionaddress, modelid, lora, image_height, image_width, CASE WHEN createtime < NOW() - INTERVAL '2 day' THEN 'false' ELSE 'true' END AS newagent, key_iv, key_content, nip05, datasource, req_type, iresearch FROM aiagents WHERE  id = '" + req.body.id + "'");
                const agentData: { [x: string]: { title: any; description: any; systemMessage: any; symbol: any; examples: any; placeHolder: any; chatLLM: any; llmRouter: any; convoCount: any; maxToken: any; temperature: any; satsPay: any; paid: any; private: any; status: any; createdBy: any; updatedBy: any; chatruns: number; category: string, commissionAddress:string,  modelid:string, lora:string, image_height:number, image_width:number, newAgent: boolean, key_iv:string, key_content:string, nip05:string, datasource:string, reqType:string, iresearch:boolean  }; }[] = [];
                const dataOutput: { [key: string]: any } = {};
                if (result.rows) {
                        result.rows.filter(item => {

                                agentData.push({
                                        [item.id]: {
                                                title: item.title,
                                                description: item.description,
                                                systemMessage: item.systemmessage,
                                                symbol: item.symbol,
                                                examples: item.examples,
                                                placeHolder: item.placeholder,
                                                chatLLM: item.chatllm,
                                                llmRouter: item.llmrouter,
                                                convoCount: item.convocount,
                                                maxToken: item.maxtoken,
                                                temperature: item.temperature,
                                                satsPay: item.satspay,
                                                paid: item.paid,
                                                private: item.private,
                                                status: item.status,
                                                createdBy: item.createdby,
                                                updatedBy: item.updatedby,
                                                chatruns: item.chatruns,
                                                newAgent: item.newagent,
                                                key_iv: item.key_iv,
                                                key_content: item.key_content,
                                                nip05: item.nip05,
                                                category: item.category,
                                                commissionAddress: item.commissionaddress,
                                                modelid: item.modelid,
                                                lora: item.lora,
                                                image_height: item.image_height,
                                                image_width: item.image_width,
                                                iresearch: item.iresearch,
                                                reqType: item.req_type,
                                                datasource: item.datasource
                                        },

                                });




                        });

                        agentData.forEach(item => {
                                const key = Object.keys(item)[0];
                                dataOutput[key] = item[key];
                            });
                        res.send({SystemPurposes: dataOutput});
                }


        }

});

data.post('/agent/create', async (req: Request, res: Response) => {

        console.log(req.body);

        const agentData:SystemPurposeData[] =  req.body;
        let count:number = 1;

        const ids = Object.keys(agentData)

                .filter(key => agentData.hasOwnProperty(key))
                .filter(async key => {

                        const agent = agentData[key as any];
                        console.log(agent);

                        if (!agent.paid) agent.paid= false;
                        if (!agent.llmRouter)  agent.llmRouter = 'nousresearch/nous-hermes-llama2-13b';
                        if (!agent.convoCount) agent.convoCount = 5;
                        if (!agent.maxToken) agent.maxToken = 512;
                        if (!agent.temperature) agent.temperature = 0.8;
                        if (!agent.satsPay) agent.satsPay = 50;
                        if (!agent.commissionAddress)agent.commissionAddress = ''
                        if (!agent.category)agent.category='Assistant'
                        if (!agent.genimage) agent.genimage=false;
                        if (!agent.modelid)  agent.modelid='';
                        if (!agent.image_height)agent.image_height=0;
                        if (!agent.image_wdith)agent.image_wdith=0;
                        if (!agent.lora) agent.lora=''
                        if (!agent.reqType) agent.reqType=''
                        if (!agent.iresearch) agent.iresearch = false;
                        if (!agent.datasource) agent.datasource = '{}';

                        const nostrUser:any = await createNostrUser(agent.title);

                        const result = await insertData("INSERT INTO aiagents (id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, commissionaddress, category, genimage, modelid, lora, image_height, image_width, req_type, iresearch, datasource, nip05,key_iv,key_content  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)",
                        [key, agent.title, agent.description, agent.systemMessage, agent.symbol, agent.examples, agent.placeHolder, agent.chatLLM,  agent.llmRouter, agent.convoCount, agent.maxToken, agent.temperature, agent.satsPay, agent.paid, agent.private, agent.status, agent.createdBy, agent.updatedBy, agent.commissionAddress, agent.category, agent.genimage, agent.modelid, agent.lora, agent.image_height, agent.image_wdith, agent.reqType, agent.iresearch, agent.datasource, nostrUser.nip05, nostrUser.key_iv, nostrUser.key_content ])
                        if (!result) return errorBadAuth(res);
                        console.log(Object.keys(agentData).length, count)
                        if (Object.keys(agentData).length === count) res.send({result: 'Update success'});
                        count++;
                        if (agent.datasource) createZepEmbeddings(key);
                });


});




export async function getAgentById (id: string):Promise<any>{


        const result = await pgclient.query("SELECT * from aiagents where id = '" + id + "';");
        return(result.rows[0]);

}

export async function getAnimateData (trackId: number):Promise<any>{

        while (true) {

                const result = await pgclient.query("SELECT * from animate_diff where track_id = '" + trackId + "';");
                if (result.rows.length > 0) return(result.rows[0]);
                await setTimeout(1000);


        }

}

data.post('/agent/update', (req: Request, res: Response) => {


        console.log(req.body);

        const columns = Object.keys(req.body);
        const values = Object.values(req.body);

        const updateQuery = `UPDATE aiagents SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(', ')} WHERE id = '` + req.body.id + `'`;
        console.log(updateQuery, values);
        pgclient.query(updateQuery, values, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send('Error updating table');
          } else {
            console.log(result);
            res.send(result);
          }
        });
        createZepEmbeddings(req.body.id);

});

data.post('/genimage', async (req: Request, res: Response) => {
        console.log(req.body);

        const body = req.body;

        await insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [body.messageId, body.conversationId,  body.app_fingerprint, body.llm_router, body.agent_type, body.prompt,  body.response, req.body, req.body]);

        const response = {status: 'all good'};
        res.send(response);

});

data.post('/feedback', async (req: Request, res: Response) => {

        console.log(req.body);
        await insertData('UPDATE messages SET feedback_type = $1 where message_id = $2',
        [req.body.feedback_type, req.body.message_id]);
        const response = {status: 'all good'};
        res.send(response);


});


export default data;

export async function insertData (insertQuery: string, insertValues:any):Promise<boolean> {
        try {
              if (!pgupdate) return false;
              await pgclient.query('BEGIN')

              const insertDataQuery =insertQuery;
              const insertDataValues = insertValues;
              console.log(insertDataQuery, insertDataValues)
              await pgclient.query(insertDataQuery, insertDataValues);

              await pgclient.query('COMMIT');
              console.log('table updated');
              return true;

        } catch (e) {
              await pgclient.query('ROLLBACK')
              console.log(e);
              return false;
        }




}

export async function updateTable(body:any):Promise<boolean>{

        const columns = Object.keys(body);
        const values = Object.values(body);

        const updateQuery = `UPDATE aiagents SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(', ')} WHERE id = '` + body.id + `'`;
        console.log(updateQuery, values);
        pgclient.query(updateQuery, values, (err, result) => {
          if (err) {
            console.error(err);
            return false;
          } else {
            console.log(result);
            return true;
          }
        });

        return false;

}