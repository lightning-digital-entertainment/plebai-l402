export type TextToImageRequest ={
    model: string;
    prompt: string;
    negative_prompt: string;
    width: number;
    height: number;
    steps: number;
    guidance: number;
    seed: number;
    scheduler: string;
    output_format: string;
}

export type TextToImageResponse = {


  "image": string,
  "seed": number
}

const mapTxt2ImgOptions = (options: TextToImageRequest) => {
    const body: any = {

        "model": options.model,
        "prompt": options.prompt,
        "negative_prompt": options.negative_prompt,
        "width": options.width,
         "height": options.height,
        "steps": options.steps,
        "guidance": options.guidance,
        "seed": options.seed,
        "scheduler": options.scheduler,
        "output_format": options.output_format

    }

    return body

}

export const txt2img = async (
    options: TextToImageRequest,
    apiUrl: string = process.env.GETIMG_URL
  ): Promise<TextToImageResponse> => {
    const body = mapTxt2ImgOptions(options)

    const endpoint = '/stable-diffusion/text-to-image'

    console.log(body);

    const result = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GETIMG_ACCESS_TOKEN
      },
    })

    if (result.status !== 200) {
      throw new Error(result.statusText)
    }

    const data: any = await result.json()
    if (!data?.image) {
      throw new Error('api returned an invalid response')
    }

    return data as TextToImageResponse
}