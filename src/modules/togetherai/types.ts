export type tgAIRequest = {
    model: string;
    prompt: string;
    request_type: string;
    width: number;
    height: number;
    steps: number;
    n: number;
    update_at: string;
    seed: number;
    image_base64?:string;
};

export type tgAIResponse ={
    status: string;
    prompt: string[];
    model: string;
    model_owner: string;
    tags: Record<string, any>;
    num_returns: number;
    args: {
      model: string;
      prompt: string;
      request_type: string;
      width: number;
      height: number;
      steps: number;
      update_at: string;
      seed: number;
      n: number;
    };
    subjobs: any[]; // You may want to create a specific type for subjobs
    output: {
      choices: any[]; // You may want to create a specific type for choices
      result_type: string;
    };
  }