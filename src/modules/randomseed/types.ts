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

type ImageResponse = {
    delayTime: number;
    executionTime: number;
    id: string;
    output: {
        automatic: {
            info: string;
            parameters: {
                alwayson_scripts: Record<string, unknown>;
                batch_size: number;
                cfg_scale: number;
                denoising_strength: number;
                do_not_save_grid: boolean;
                do_not_save_samples: boolean;
                enable_hr: boolean;
                eta: null | number;
                firstphase_height: number;
                firstphase_width: number;
                height: number;
                hr_negative_prompt: string;
                hr_prompt: string;
                hr_resize_x: number;
                hr_resize_y: number;
                hr_sampler_name: null | string;
                hr_scale: number;
                hr_second_pass_steps: number;
                hr_upscaler: null | string;
                n_iter: number;
                negative_prompt: string;
                override_settings: null | Record<string, unknown>;
                override_settings_restore_afterwards: boolean;
                prompt: string;
                restore_faces: boolean;
                s_churn: number;
                s_min_uncond: number;
                s_noise: number;
                s_tmax: null | number;
                s_tmin: number;
                sampler_index: string;
                sampler_name: string;
                save_images: boolean;
                script_args: any[];
                script_name: null | string;
                seed: number;
                seed_resize_from_h: number;
                seed_resize_from_w: number;
                send_images: boolean;
                steps: number;
                styles: null | any[];
                subseed: number;
                subseed_strength: number;
                tiling: boolean;
                width: number;
            };
        };
        image_urls: string[];
        response_time: number;
        track_id: string;
    };
    status: string;
}

