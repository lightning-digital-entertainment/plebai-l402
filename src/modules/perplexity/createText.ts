


/* eslint-disable @typescript-eslint/no-var-requires */
const sdk = require('api')('@pplx/v0#3ypqbslpiwqs9j');

sdk.auth(process.env.PPLX_API_KEY);


export async function textResponse(agentData:any, messages:any): Promise<any>  {



    return await sdk.post_chat_completions({
        model: agentData?.modelid,
        // temperature:0.2,
        messages
      })




}




