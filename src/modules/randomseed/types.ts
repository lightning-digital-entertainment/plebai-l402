export type txt2imgRequest = {
    
    model_name: string;
    prompt: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    steps?: number;
    cfg_scale?: number;
    number_of_images?: number;
    seed?: number;
    sampler_name?: string;

};

export type img2imgRequest = {
    access_token: string;
    model_name: string;
    prompt: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    steps?: number;
    cfg_scale?: number;
    number_of_images?: number;
    seed?: number;
    sampler_name?: string;
    include_init_images: boolean;
    image_strength: number;
    image_url: string;
    mask: string;
    inpaint_full_res: boolean;
    inpaint_full_res_padding: number;
    inpainting_fill: number;
    inpainting_mask_invert: number;
    resize_mode: number;


};

export type animateRequest = {
    model_name: string;
    prompt: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    steps?: number;
    cfg_scale?: number;
    number_of_images?: number;
    seed?: number;
    sampler_name?: string;
    webhook: string;
    track_id: number;
    motion_model_name: string;
    fps: number;
    format: string;
    video_length: number;



}


export type asyncResponse = {
    message?: string;
};

export type syncResponse = {
    message?: string;
    output?:string[]
};