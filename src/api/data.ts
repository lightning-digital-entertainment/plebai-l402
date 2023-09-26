import { Request, Response, Router } from 'express';
import { SystemPurposes } from '../modules/data';
import {Client} from 'pg'
import { SystemPurposeData } from '../modules/data';
import { errorBadAuth, getImageUrl } from '../modules/helpers';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync } from 'fs'

const data = Router();

dotenv.config();

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
                const imageString = req.body.input;
                writeFileSync( process.env.UPLOAD_PATH + id + `.` + req.body.type, imageString.split(",")[1], 'base64')
                const response =  await getImageUrl(id, req.body.type);
                console.log(response);
                res.send(({'url' : response}))
                
        } catch (error) {
                res.send({'error' : true})
        }
        

});
data.post('/agents', async (req: Request, res: Response) => {

        console.log(req.body);

        if (!pgupdate) {
                res.send({SystemPurposes})

        } else {

                const result = await pgclient.query("select id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby  from aiagents where status = 'active' and private = false UNION select id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby  from aiagents where createdby = '" + req.body.fingerPrint + "';");
                const agentData: { [x: string]: { title: any; description: any; systemMessage: any; symbol: any; examples: any; placeHolder: any; chatLLM: any; llmRouter: any; convoCount: any; maxToken: any; temperature: any; satsPay: any; paid: any; private: any; status: any; createdBy: any; updatedBy: any; }; }[] = [];
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
                        if (!agent.llmRouter)  agent.llmRouter = 'meta-llama/llama-2-13b-chat';
                        if (!agent.convoCount) agent.convoCount = 20;
                        if (!agent.maxToken) agent.maxToken = 256;
                        if (!agent.temperature) agent.temperature = 0.8;
                        if (!agent.satsPay) agent.satsPay = 50;

                        const result = await insertData("INSERT INTO aiagents (id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
                        [key, agent.title, agent.description, agent.systemMessage, agent.symbol, agent.examples, agent.placeHolder, agent.chatLLM,  agent.llmRouter, agent.convoCount, agent.maxToken, agent.temperature, agent.satsPay, agent.paid, agent.private, agent.status, agent.createdBy, agent.updatedBy ])
                        if (!result) return errorBadAuth(res);
                        console.log(Object.keys(agentData).length, count)
                        if (Object.keys(agentData).length === count) res.send({result: 'Update success'});
                        count++;
                });


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

