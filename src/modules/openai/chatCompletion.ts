import OpenAI from "openai";
import * as dotenv from 'dotenv';
import { IDocument, ZepClient } from "@getzep/zep-js";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,

  });


export async function textResponseWithZep(agentData:any, messages:any): Promise<string>  {

    const tools:OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: "function",
          function: {
            name: "search_zepdocs",
            description: "Use this tool to get knowledge from source documents",
            parameters: {
                type: "object",
          properties: {
            query: {
              type: "string",
              description: "Provide the query input to search and get knowledge from source documents",
            },
            collectionName: {
                type: "string",
                description: "use this value: " + agentData.collectionname,
              }
          },
          required: ["query", "collectionName"],
            },
          },
        },
      ];

     

      console.log('Collection Name: ', agentData.collectionname);

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

        const toolCall = responseMessage?.tool_calls?responseMessage?.tool_calls[0]:null;

        if (responseMessage.tool_calls) {
            // Step 3: call the function
            // Note: the JSON response may not always be valid; be sure to handle errors
            const availableFunctions = {
                search_zepdocs: searchZep,
            }; // only one function in this example, but you can have multiple
            messages.push(responseMessage); // extend conversation with assistant's reply
            const functionArgs = JSON.parse(toolCall.function.arguments);
            const functionResponse:IDocument[] = await searchZep(
                functionArgs.query, functionArgs.collectionName
            );

            messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                // name: toolCall.function.name,
                content: JSON.stringify(functionResponse),
              }); // extend conversation with function response
        }   else {

            const zepResult = await searchZep(messages[messages.length -1].content, agentData.collectionname)



            messages[0].content = messages[0].content + '. Use this information I found on the source document: ' + JSON.stringify(zepResult) + ' ';


        }

            console.log(messages);
            const secondResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-1106",
              messages,
            }); // get a new response from the model where it can see the function response
            console.log(secondResponse.choices);

            return secondResponse.choices[0].message.content;




}


export async function visionResponse(model:string, messages:any): Promise<OpenAI.Chat.Completions.ChatCompletion>  {

    return await openai.chat.completions.create({
        model,
        stream: false,
        max_tokens: 1024,
        messages: [
          {
            "role": "system",
            "content": messages[0].content

          },
          {
            "role": "user",
            "content": messages[messages.length -1].content
          }


        ] });





}

async function searchZep(query:string, collectionName:string) {

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(collectionName);

    const result =     await collection.search(
        {
           mmrLambda: 0.5,
           searchType: "similarity",
           text: query,
        },
        5
     );

    return result.map((item: any) => {
        return { ...item, embedding: {} };
    });



}


/* Assistant code

 const thread = await openai.beta.threads.messages.create(agentData?.modelid,

                        {
                          role: "user",
                          content: body.messages[body.messages.length -1].content
                        }

                      );

                      console.log(thread);

                      const run = await openai.beta.threads.runs.create(
                        agentData?.modelid,


                          { assistant_id: "asst_ZRQo0Vx40LuInwAkA5v9ThkG" }


                      );

                      console.log(run);

                      let runCheck = true;
                      let messageId = '';

                      do {

                        const runStatus = await openai.beta.threads.runs.retrieve(
                          agentData?.modelid,
                          run.id
                        );
                        console.log(runStatus);
                        if ( runStatus.status !== 'completed') {
                          await sleep(1000);
                        } else {

                          const runStep = await openai.beta.threads.runs.steps.list(
                            agentData?.modelid,
                            run.id
                          );
                          console.log(runStep);

                          runCheck = false;
                          const stepDetails:RunStep[] = runStep.data;

                          const messageCreation: any  = stepDetails[0].step_details;
                          messageId = messageCreation.message_creation.message_id;
                        }
                      } while (runCheck);



                      const message = await openai.beta.threads.messages.retrieve(
                        agentData?.modelid,
                        messageId
                      );

                      console.log(message);

                      const result:any = message.content[0];
                      console.log('result: ', result);
                      response = result.text.value;





*/