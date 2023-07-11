import { Request, Response, Router } from 'express';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import * as dotenv from 'dotenv';

dotenv.config();

const chat = new ChatOpenAI({temperature: 0.5});

const l402 = Router();




l402.get('/', async (req: Request, res: Response) => {

  const response = await chat.call([
    new HumanMessage(
      "Translate this sentence from English to French. I love programming."
    ),
  ]);

  res.json(response);
});

export default l402;
