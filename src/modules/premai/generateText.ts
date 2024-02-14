import Prem from "@premai/prem-sdk";


const client = new Prem({
    apiKey: process.env.PREM_API_KEY,
  })

const projectId = '124';

export async function genTextUsingPrem (agentData:any, messages:any[], toolsToUse:{}, callback?: (result: string) => void){

    const responseAsync = await client.chat.completions.create({
        project_id:projectId,
        messages,
        model:agentData.modelid,
        temperature:agentData.temperature,
        stream: true
    })

    for await (const chunk of responseAsync) {
        if (chunk.choices[0].delta.content) {
          callback(chunk.choices[0].delta.content)
        }
    }



}