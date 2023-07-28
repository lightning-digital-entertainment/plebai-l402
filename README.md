# `PlebAI` 💬

This is a backend for PlebAI that handles L402 auth, langchain and accessing local LLMs


Silicon valley elites are pouring billions of dollars in building closed AI systems that can ingest all of our data. Then scare politicians into creating regulations that install them as overlords. They will not win in that game because of millions of Plebs like us band together, build in public, democratize AI access for all and beat them in their own game. 

We call this movement PlebAI. 

Website: https://plebai.com

AI Chat: https://chat.plebai.com


## Serving L402 Authed Agents

### YouTube Chat Agent 

This agent lets you search any Youtube video and get summary of that video transcript. Then you can chat with it by asking questions on the transcript. You can get the overall content and some specifics in less than 5 mins on a 1 hour video.  

#### How is it done?

The functionality of the Youtube chat agent revolves around the receipt of a Youtube video link or title from the user. Initially, the system performs a search for the specified Youtube video utilizing the Search Engine Results Pages (SERP) API. This process results in the procurement of the exact Youtube URL.

Following this, the system engages a Youtube transcript downloader to retrieve a comprehensive transcript of the video content. In the case of a video with an approximate duration of one hour, the transcript would typically contain around 30,000 words. However, due to the input token limit of 16,000 tokens in ChatGPT, this full transcript cannot be directly input into the AI model.

To resolve this issue, a text splitter is employed. This tool segments the comprehensive transcript into smaller, manageable portions that comply with the token limit, enabling it to be fed into ChatGPT.

Once the transcript has been successfully split and input, ChatGPT gets to work and generates a concise summary of the video's content. This summary provides a quick, simplified overview of the video's substance, designed for user convenience.

After the generation of the summary, an additional step is taken to further enhance the user experience. The summary is fed back into ChatGPT, which then generates five suggested questions based on the summarized content. This feature makes the information more accessible to users and prompts them to engage with the material on a deeper level.

However, this sophisticated process comes with certain costs. The use of the SERP API and the OpenAI API, integral components of this system, are not free services. To balance these expenses, a financial component has been introduced to the API access. This means that an HTTP 402 (Payment Required) status code is incorporated into the system. Users will need to make a payment in order to use this API, a necessary step to cover the costs of operating the system and to ensure its sustained functionality.


#### L402 (Lightning Labs)

L402, previously known as LSAT, is a standard that supports the use case of charging for services and authenticating users in distributed networks. It combines the strengths of Macaroons for improved authentication with the capabilities of the Lightning Network for enhanced payments. We plan to utilize this standard to access 3rd party data and APIs.

L402 spec is here. https://docs.lightning.engineering/the-lightning-network/l402

Protocol specifications makes it easier for Interoperability, security, data integrity and error handling. To make it clear, we are not changing anything. We are just re confirming what lightning labs have put together the protocol spec for L402

Here's the summary:

(Server sending 402 payment required status)

WWW-Authenticate: - header type response (WWW in caps as per Mozilla spec)

L402 – Static word all caps

macaroon=””, (All lower case word macaroon and double quotes)

invoice=”” (All lower case invoice and double quotes)

### DEMO

Step 1: Execute this API call 

```
curl --location 'https://l402.plebai.com/v1/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
     "messages": [
        {
            "role": "system",
            "content": "Provide a summary of the youtube video transcript. "
        },
        {
            "role": "user",
            "content": "Get this video https://youtu.be/1-njHwhKrPY"
        }
    ],
    "stream": false
}'

```

Response from API

```
status: 402 Payment Required

Header:
WWW-Authenticate: L402 macaroon="AgELcGxlYmFpLWw0MDIChAEwMDAwMGY4Y2FmOWMxNTEyOTA3NjAxNDhiZmMyNTY3OTY4N2NhNjNjZWYyZDRjNWU2YjJiODg4ZjY2ZDdlYjExMzMxNzMyZmNjOWRkZjlmZmRlMzk3Mzc0YjNlNDY5NzFjNzQ0MzMwMmM3YmQ2ZmFmODg0YTIzYzlhYTJjOGIwMGJjZjIAAklib2R5SGFzaD01Y2MzNGJmNWJhNDQ4MDIxZWUzNzViNzZiMTQ3ZDY0YTY1OGE1OTYyOTc1MGEwZmNiZjgzNzI2N2Q5OTNjZGYxAAIYZXhwaXJhdGlvbj0xNjkwNTc4ODQ1NjQ2AAAGII78/s+vgouYWVQj+bazIc6B5WWugu86hwTs1N/xeB+9", invoice="lnbc1u1pjvgtqepp5p7x2l8q4z2g8vq2ghlp9v7tg0jnremedf30xk2ug3and06c3xvtshp5ywzxcktp43fg6nmawyeduzltzv4t0lld0ju33fm6zg86f4dnkvjqcqzpgxqyz5vqrzjqd0ylaqclj9424x9m8h2vcukcgnm6s56xfgu3j78zyqzhgs4hlpzvzlthsqqf0gqqyqqqqqqqqqqqqqqqqrzjqvjpj9slq5z6j4wyqf0fp66yraw0tvgr4xde7tx799jlhq8xk2wcczumkcqqfacqqyqqqqqqqqqqqqqqqqsp5eja6g95y9cmxpsu27829hm72pqtx3fv3gujhkr8c6956le3hx54q9qyyssqpsedqdsdg7mr2w4aknwdm6nwdlg05lly4enayuzsm4ns6w75h8d4wd5amwxj6dr3wrhhsrlnqle03mk0zlkeaxxwcr0s5yednlv5q5spw5yyfk"

```

Step 2:

Use a wallet to pay the invoice and get the preiamge. Use last-js to put that preiamge inside the token

```
const {Lsat} = require('lsat-js')

async function run() {

  //Copy and paste from API header by replacing L402 with LSAT
  const header = 'LSAT macaroon="AgELcGxlYmFpLWw0MDIChAEwMDAwOWMyNzAzNDJmOTIwOWI0MDIzYjU3Y2IyMDg4Y2E5NGFlNDAxYWEzNzVlMGE2NzA2YWQ1YTk1ZmIwZmFhZmQzMzJmNGQyOWQ1MmI4M2RlNmQyYTQ2M2MzZDI0YTFhZjY3Y2U2NmY4NjBlZDY0NmJhZDQxZjY4MzJmOGE1N2JlOTIAAklib2R5SGFzaD05NDYwMjllZmY0ZWQ1MTNiZGM2NTllMmY4ODU0Y2M2NjNjMWE4M2U4Mjc5MTAyNGQxZjlkYmRmNWE3OTY3NDNhAAIYZXhwaXJhdGlvbj0xNjkwNTU3NzM5NDM4AAAGIOF/zZ1E8YF3PvkkRxKloeffFFuUcGl837kt4ksvWvz2", invoice="lnbc1u1pjv8kd8pp5nsnsxsheyzd5qga40jeq3r9fftjqr23htc9xwp4dt22lkra2l5eshp5ywzxcktp43fg6nmawyeduzltzv4t0lld0ju33fm6zg86f4dnkvjqcqzpgxqyz5vqrzjqd0ylaqclj9424x9m8h2vcukcgnm6s56xfgu3j78zyqzhgs4hlpzvzlthsqqf0gqqyqqqqqqqqqqqqqqqqrzjqvjpj9slq5z6j4wyqf0fp66yraw0tvgr4xde7tx799jlhq8xk2wcczumkcqqfacqqyqqqqqqqqqqqqqqqqsp53tsguzuqq3avelkvj3mqsmayrvy9vqn5uw7yhq0637csm29a3vxq9qyyssqhc97remzya0w2523z9x0lrutdugxkxusrxzj49wqjkaywdjjf2ryvtkszcru49gfwcvm5675zscgvxpjcxdnvk9x4q77vmzmyz36q8sp3y2ckh"'
  const lsat = Lsat.fromHeader(header)

  //get preimage from the wallet
  const preimage = '8272ed58e6d2aa3c22f188688afc1ecd528a530f227b8eea9f9e8f01c0941e6f'

  lsat.setPreimage(preimage)

  //if preimage matches then print the output
  if (lsat.isSatisfied) console.log(lsat.toToken());



}
run()
```

Step 3:

Take the output from Step 2 and add it as auth header in the same API call. 

```
curl --location 'https://l402.plebai.com/v1/chat/completions' \
--header 'Authorization: L402 AgELcGxlYmFpLWw0MDIChAEwMDAwMGY4Y2FmOWMxNTEyOTA3NjAxNDhiZmMyNTY3OTY4N2NhNjNjZWYyZDRjNWU2YjJiODg4ZjY2ZDdlYjExMzMxNzMyZmNjOWRkZjlmZmRlMzk3Mzc0YjNlNDY5NzFjNzQ0MzMwMmM3YmQ2ZmFmODg0YTIzYzlhYTJjOGIwMGJjZjIAAklib2R5SGFzaD01Y2MzNGJmNWJhNDQ4MDIxZWUzNzViNzZiMTQ3ZDY0YTY1OGE1OTYyOTc1MGEwZmNiZjgzNzI2N2Q5OTNjZGYxAAIYZXhwaXJhdGlvbj0xNjkwNTc4ODQ1NjQ2AAAGII78/s+vgouYWVQj+bazIc6B5WWugu86hwTs1N/xeB+9:696c3581ed3402c27b1d6a7da5c1efbc47cd9c75f6a44c1105a4f3ae7f4ff41b' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "system",
            "content": "Provide a summary of the youtube video transcript. "
        },
        {
            "role": "user",
            "content": "Get this video https://youtu.be/1-njHwhKrPY"
        }
    ]
}'
```

API Response:

```
{
    "id": "chatcmpl-daaa5115-1a43-4ffb-aedd-17aed3dff04e",
    "model": "plebai-l402",
    "created": 1690578522641,
    "object": "chat.completion.chunk",
    "choices": [
        {
            "index": 0,
            "delta": {
                "role": "assistant",
                "content": "Found the Youtube video ... How to Get the Transcript of a YouTube Video with video length: 2:14 with views: 133406 published 1 year ago and youtube link: https://www.youtube.com/watch?v=qWdyhFiyH0Y\n The video explains how to find a written transcript for a video uploaded to YouTube. It mentions that transcripts are only available if closed captions have been enabled or uploaded by the video's owner. To find the transcript, users need to open the YouTube video on a desktop browser, click on the triple dotted icon underneath the video, and then click on \"Open transcript.\" The transcript will appear next to or under the video, with lines of text highlighted as they are spoken. Users can toggle off the timestamps and search for specific words or topics using the search function. If there are multiple languages available, users can choose which language is displayed. To save a copy of the transcript, users can highlight the text and copy and paste it into another document. It is mentioned that some transcripts may be automatically generated and not entirely accurate. The video concludes by encouraging viewers to subscribe for more YouTube and technology-related videos.\n\n Here are suggested questions to ask and learn more about: \n 1. How can users find the transcript of a YouTube video?\n2. What conditions need to be met for a transcript to be available?\n3. How can users toggle off the timestamps in the transcript?\n4. What options are available if there are multiple languages in the transcript?\n5. What caution is given regarding the accuracy of some transcripts?"
            },
            "finish_reason": "stop"
        }
    ]
}
```

How to set up this repo locally.

1. replace env.example with the correct entries

## use your OpenAI API key
OPENAI_API_KEY=''
## Local port where the application will be running
PORT=5002
## SERP API key from serpai.com
SERP_API_KEY=''

## Lightning address where the sats will go
LIGHTNING_ADDRESS=''

## Any random number
SIGNING_KEY=''
## Static location to indentify origin
MAC_LOCATION=''
## Sats amount you charge for the API
SATS_AMOUNT='100'

## Setup

```
npm install
```

## Lint

```
npm run lint
```

## Test

```
npm test
```

## Development

```
npm run dev
```

## Notes:

1. I have a condition to bypass 402 auth for dev/testing from localhost. If you want to test auth, then change localhost to ipaddress

2. I am not use lsat-js as dependency. Pulled the source code to /modules/1402js folder to change from LSAT to L402

3. In order to keep the API body the same, I am hashing the body and adding it to macaroon

4. There is also an expiration of 15 mins added as caveat. 

5. I am not storing the preimage and checking for duplicates. This can be easily added by local memory storage such as redis. 


# About Us

We build open source Apps to solve real world problems using Bitcoin, Lightning, Nostr and AI

For questions, Please reach out to plebai@getcurrent.io

# License

[MIT](https://choosealicense.com/licenses/mit/)