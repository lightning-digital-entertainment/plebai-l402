// noinspection JSUnusedGlobalSymbols

declare namespace NodeJS {

  // available to the server-side
  interface ProcessEnv {

    // OpenAI - chat.ts
    OPENAI_API_KEY: string;
    OPENAI_API_ORG_ID: string;
    OPENAI_API_HOST: string;

  }

}
