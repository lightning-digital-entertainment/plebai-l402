export type SinkInRequest = {
    access_token: string;
    model_id: string;
    version?: string;
    prompt: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    use_default_neg?: string;
    steps?: number;
    scale?: number;
    num_images?: number;
    seed?: number;
    scheduler?: string;
    lora?: string;
    lora_scale?: number;
    init_image_file?: File | null;
    image_strength?: number;
    controlnet?: 'canny' | 'depth' | 'openpose';
};

export type SinkInResponse = {
    error_code: number;
    images?: string[];
    credit_cost?: number;
    inf_id?: string;
    message?: string;
};