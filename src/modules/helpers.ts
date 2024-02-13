import { LightningAddress } from "alby-tools";
import { InvoiceResponse } from "../typings/invoice";
import { Lsat, Identifier, Caveat, getRawMacaroon, verifyMacaroonCaveats, expirationSatisfier } from './l402js'
import * as Macaroon from 'macaroon'
import { sha256 } from "js-sha256";
import * as fs from 'fs';
import { type Event as NostrEvent, relayInit } from 'nostr-tools';
import { createReadStream, createWriteStream, readFile, unlink, writeFile } from "fs";
import FormData from 'form-data';
import axios from "axios";
import sharp from "sharp";
import { IDocument } from "@getzep/zep-js";
import * as url from 'url';
import {exec } from 'child_process';
import * as crypto from 'crypto';

export const relayIds = [
  'wss://relay.current.fyi',
  'wss://nostr1.current.fyi',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.damus.io',
  'wss://nostr-relay.wlvs.space',
  'wss://nostr.zebedee.cloud',
  'wss://student.chadpolytechnic.com',
  'wss://global.relay.red',
  'wss://nos.lol',
  'wss://relay.primal.net',
                'wss://nostr21.com',
                'wss://offchain.pub',
                'wss://relay.plebstr.com',
                'wss://nostr.mom',
                'wss://relay.nostr.bg',
                'wss://nostr.oxtr.dev',
                'wss://relay.nostr.bg',
                'wss://no.str.cr',
                'wss://nostr-relay.nokotaro.com',
                'wss://relay.nostr.wirednet.jp'

];

export const ModelIds = [
  "stable-diffusion-xl-v1-0",
  "dark-sushi-mix-v2-25",
  "absolute-reality-v1-6",
  "synthwave-punk-v2",
  "arcane-diffusion",
  "moonfilm-reality-v3",
  "moonfilm-utopia-v3",
  "moonfilm-film-grain-v1",
  "openjourney-v4",
  "realistic-vision-v3",
  "icbinp-final",
  "icbinp-relapse",
  "icbinp-afterburn",
  "xsarchitectural-interior-design",
  "mo-di-diffusion",
  "anashel-rpg",
  "realistic-vision-v1-3-inpainting",
  "eimis-anime-diffusion-v1-0",
  "something-v2-2",
  "icbinp",
  "analog-diffusion",
  "neverending-dream",
  "van-gogh-diffusion",
  "openjourney-v1-0",
  "realistic-vision-v1-3",
  "stable-diffusion-v1-5-inpainting",
  "gfpgan-v1-3",
  "real-esrgan-4x",
  "instruct-pix2pix",
  "stable-diffusion-v2-1",
  "stable-diffusion-v1-5"
]

export interface EncryptedData {
  iv: string;
  content: string;
  key: string;
}

export function encrypt(text: string, key:string): EncryptedData {
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    key
  };
}


export async function getLsatToChallenge(requestBody: string, amtinsats: number): Promise<Lsat> {

    const ln = new LightningAddress(process.env.LIGHTNING_ADDRESS);
    await ln.fetch();
    const invoice = await ln.requestInvoice({satoshi: amtinsats});

    const identifier = new Identifier({
      paymentHash: Buffer.from(invoice.paymentHash, 'hex'),
    })

    const macaroon = Macaroon.newMacaroon({
      version: 1,
      rootKey: process.env.SIGNING_KEY,
      identifier: identifier.toString(),
      location: process.env.MAC_LOCATION,
    })

    const lsat = Lsat.fromMacaroon(getRawMacaroon(macaroon), invoice.paymentRequest)
    const caveat = Caveat.decode('bodyHash=' + sha256.update((JSON.stringify(requestBody))));

    const caveatExpiry = new Caveat({
      condition: 'expiration',
      // adding 15 mins expiry
      value: Date.now() +  900000
    })

    lsat.addFirstPartyCaveat(caveat)
    lsat.addFirstPartyCaveat(caveatExpiry)

    console.log(lsat.toJSON());
    console.log('Caveats: ', lsat.getCaveats())

    return lsat;


}

export function vetifyLsatToken(lsatToken: any, requestBody: string,): boolean {

  try {


    const bodyhash: string = ''+ sha256.update((JSON.stringify(requestBody)));
    const lsat = Lsat.fromToken(lsatToken);

    // Check to see if expires or preimage/hash not satisfied
    if (lsat.isExpired()  || !lsat.isSatisfied) return false;

    const result = verifyMacaroonCaveats(
      lsat.baseMacaroon,
      process.env.SIGNING_KEY,
      expirationSatisfier
    )
    // check if macaroon is not tampered
    if (!result) return false;

    const caveats = lsat.getCaveats();

    // check if the body hash matches
    for (const caveat of caveats) {
        if (caveat.condition === 'bodyHash' && caveat.value !==bodyhash) {
          console.log('inside bodyhash', caveat.value)
          return false;
        }

    }

  } catch (error) {
    console.log('Inside catch with error: ', error)
    return false;


  }

  return true;
}

export function sendHeaders(stream: boolean): any {
    if (stream) {

          return  {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Connection': 'keep-alive',
            'server': 'uvicorn',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked'
          };

    }
    else {

          return {
            'Content-Type': 'application/json',
            'server': 'uvicorn',
          };
    }


}


export function requestApiAccess(apiPath: string): { headers: HeadersInit, url: string } {
  // API key


  // API host
  const host = (process.env.CURRENT_API_HOST || '').trim();

  return {
    headers: {
      'Content-Type': 'application/json',
    },
    url: host + apiPath,
  };
}

export function generateRandom10DigitNumber():number {
  const min = 1000000000; // 10-digit number starting with 1
  const max = 9999999999; // 10-digit number ending with 9

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

export function generateRandom9DigitNumber():number {
  const min = 100000000; // 9-digit number starting with 1
  const max = 999999999; // 9-digit number ending with 9

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}



export function generateRandom5DigitNumber():number {
  const min = 1000; // 4-digit number starting with
  const max = 10000; // 5-digit number ending with

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function readRandomRow(filePath: string): string | null {
  try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length === 0) {
          return null;
      }
      const numberOfLines = content.split('\n');

      const randomIndex = getRandomInt(1, numberOfLines.length);
      return lines[randomIndex];
  } catch (err) {
      console.error('Error reading the file:', err);
      return null;
  }
}


export function publishRelays(event: NostrEvent) {
  relayIds.forEach(async function(item) {
        console.log('publishing on', item);
        try {
          await  publishRelay(item, event);

        } catch (error) {
          console.log('in catch with error: ', error)
        }

  });

}

export async function publishRelay(relayUrl:string, event: NostrEvent) {

  try {

    const pubrelay = relayInit(relayUrl);
    await pubrelay.connect();
    await pubrelay.publish(event);


  } catch (e) {

    console.log('in catch with error: ', e);

  }


}

export async function getImageUrl(id: string, outputFormat:string): Promise<string> {


  const form = new FormData();
  form.append('asset', createReadStream(process.env.UPLOAD_PATH + id + `.` + outputFormat));
  form.append("name", 'current/plebai/genimg/' + id + `.` + outputFormat);
  form.append("type", "image");

  const config = {
      method: 'post',
      url: process.env.UPLOAD_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'multipart/form-data',
        ...form.getHeaders()
      },
      data: form
  };

  const resp = await axios.request(config);


  unlink(process.env.UPLOAD_PATH + id + `.` + outputFormat, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })

  return resp.data.data;

}

export async function deleteImageUrl(name: string) {


  const data = JSON.stringify({name});

  const config = {
      method: 'post',
      url: process.env.DELETE_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'application/json',
      },
      data
  };

  axios.request(config);
  // console.log(resp);

}

export async function getImageUrlFromFile(dir: string, file: string): Promise<string> {


  const form = new FormData();
  form.append('asset', createReadStream(dir+ file));
  form.append("name", 'current/plebai/genimg/' + file);
  form.append("type", "image");

  const config = {
      method: 'post',
      url: process.env.UPLOAD_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'multipart/form-data',
        ...form.getHeaders()
      },
      data: form
  };

  const resp = await axios.request(config);


  unlink(dir + file, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })

  return resp.data.data;

}
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
          } else {
              matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
              );
          }
      }
  }
  return matrix[b.length][a.length];
}

// Function to find the string with the strongest match
export function findBestMatch(target: string, list: string[]): string {
  let minDistance = Infinity;
  let bestMatch = "";

  for (const str of list) {
      const distance = levenshtein(target, str);
      if (distance < minDistance) {
          minDistance = distance;
          bestMatch = str;
      }
  }

  return bestMatch;
}

export function closestMultipleOf256(num: number): number {
  // Round to the nearest integer in case of floating point numbers.
  num = Math.round(num);

  const remainder = num % 256;
  if (remainder === 0) {
      return num; // The number is already a multiple of 256.
  }

  if (remainder <= 128) {
      return num - remainder; // Round down (or up for negative numbers)
  } else {
      return num + (256 - remainder); // Round up (or down for negative numbers)
  }
}

export async function getBase64ImageFromURL(url: string): Promise<string> {
  try {

      if (url === null) return null;

      const response = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer'
      });

      const imageBuffer = Buffer.from(response.data);

      console.log('image buffer')
      const image = sharp(imageBuffer);

      const metadata = await image.metadata();

      if (metadata.width > 1024 || metadata.height > 1024) {
          console.log('inside iamge resize')
          image.resize({
              width: 1024,
              height: 1024,
              fit: sharp.fit.inside,
              withoutEnlargement: true
          });

          const buffer = await image.toBuffer();
          return buffer.toString('base64');
      }

      return Buffer.from(response.data).toString('base64');

  } catch (error) {

      console.log('Error at getBase64ImageFromURL',error)
      return null;

  }

}

export function saveBase64AsImageFile(filename: string, base64String: string) {
  // Convert base64 string to a buffer
  const buffer = Buffer.from(base64String, 'base64');

  // Write buffer to a file
  fs.writeFileSync(process.env.UPLOAD_PATH +filename, buffer);
}

export function getResults(results: IDocument[]): string {

  let data=''
  for (const result of results) {
     data = data + " " + result.content;
  }

  return data;
}

export function removeKeyword(inputString: string): { keyword: string; modifiedString: string } {
  const keywords = ['/photo', '/midjourney'];
  const keyword = keywords.find(keyword => inputString.includes(keyword));
  const modifiedString = inputString.replace(keyword, '');
  return {keyword, modifiedString};
}

export function errorBadAuth(res:any) {
  return res.status(400).send({
    error: true,
    code: 1,
    message: 'bad auth',
  });
}

export function splitStringByUrl(inputString: string): string[] {

  try {

    const urlObject = url.parse(inputString);
    const urlIndex = inputString.indexOf(urlObject.href!);

    return [
        inputString.slice(0, urlIndex).trim(),
        urlObject.href!
    ];

  } catch (error) {
    console.log(error);
    return null;
  }

 }

 export function extractUrls(text: string): string {
  const urlRegex = /(\b(https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  const matches = text.match(urlRegex);

  if (!matches) {
    return '';
  }

  return matches.map(url => JSON.stringify({
    type: "image_url",
    image_url: {
      "url": url
    }
  })).join(',\n');
}

export function extractUrl(text: string): string {
  const urlRegex = /(\b(https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  const matches = text.match(urlRegex);

  if (!matches) {
    return '';
  }

  return matches[0];
}



function errorDailyLimit(res:any) {
  return res.status(400).send({
    error: true,
    code: 1,
    message: 'Exceeded daily limit of 50,000 sats',
  });
}

export function errorInvoicePaid(res:any) {
  return res.status(500).send({
    error: true,
    code: 1,
    message: 'Invoice already paid...',
  });
}

export function errorBadArguments(res:any) {
  return res.status(500).send({
    error: true,
    code: 2,
    message: 'bad arguments',
  });
}

export function errorUnauthorized(res:any) {
  return res.status(401).send({
    error: true,
    code: 2,
    message: 'Auth failed',
  });
}

export function errorAdultcontent(res:any) {
  return res.status(500).send({
    error: true,
    code: 2,
    message: 'Adult content detected..!',
  });
}

export function errorServer(res:any) {
  return res.status(500).send({
    error: true,
    code: 3,
    message: 'internal Server error',
  });
}

export async function getGifUrl(url:string, filePath: string,id:string, type:string): Promise<string> {


  let fileName = id + '.mp4';

  const localFile = process.env.UPLOAD_PATH?process.env.UPLOAD_PATH + fileName:'';

  if (url !== '') await (downloadFile(url, localFile));

  fileName = id + '.gif';


  let cmd = 'ffmpeg -i input -q:a 0 output';
  cmd = cmd.replace(new RegExp('input', 'g'), localFile).replace('output', process.env.UPLOAD_PATH +fileName);
  console.log(cmd);
  await executeCommand(cmd); // Replace 'ls' with your command

  console.log('s3 name: ', filePath + fileName);

  const form = new FormData();
  form.append('asset', createReadStream(process.env.UPLOAD_PATH +fileName));
  form.append("name", filePath + fileName);
  form.append("type", type);

  const config = {
      method: 'post',
      url: process.env.UPLOAD_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'multipart/form-data',
        ...form.getHeaders()
      },
      data: form
  };

  const resp = await axios.request(config);
  console.log('Current file: ', resp.data.data);

  unlink(localFile, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })

  unlink(process.env.UPLOAD_PATH +fileName, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })



  return resp.data.data;

}

export async function getCurrentUrl(url:string, filePath: string,id:string, type:string): Promise<string> {


  const fileName = id + '.' + type;

  const localFile = process.env.UPLOAD_PATH?process.env.UPLOAD_PATH + fileName:'';

  if (url !== '') await (downloadFile(url, localFile));


  console.log('s3 name: ', filePath + fileName);

  const form = new FormData();
  form.append('asset', createReadStream(localFile));
  form.append("name", filePath + fileName);
  form.append("type", type);

  const config = {
      method: 'post',
      url: process.env.UPLOAD_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'multipart/form-data',
        ...form.getHeaders()
      },
      data: form
  };

  const resp = await axios.request(config);
  console.log('Current file: ', resp.data.data);

  unlink(localFile, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })

  return resp.data.data;

}

async function downloadFile(url: string, localFile:string): Promise<void> {
  const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream'
  });


  return new Promise((resolve, reject) => {
      const writer = createWriteStream(localFile);
      response.data.pipe(writer);
      let error: any = null;
      writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
      });
      writer.on('close', () => {
          if (!error) {
              console.log(localFile);
              resolve();
          }
      });
  });
}

export async function readFromFile(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
     readFile(filename, 'utf8', (err, data) => {
       if (err) {
         reject(err);
       } else {
         resolve(data);
       }
     });
  });
 }

 // Function to write text to a file
export async function writeToFile(filename: string, data: string): Promise<void> {
 return new Promise((resolve, reject) => {
    writeFile(filename, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
 });
}

function executeCommand(command: string): Promise<string> {

  try {

        return new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
              if (error) {
                  reject(`Error: ${error.message}`);
                  return;
              }
              resolve(stdout);
          });
      });

  } catch (error) {
    console.log('Error in cmd: ', error);
    return null;

  }

}

