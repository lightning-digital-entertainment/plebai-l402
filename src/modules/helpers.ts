import { LightningAddress } from "alby-tools";
import { InvoiceResponse } from "../typings/invoice";
import { Lsat, Identifier, Caveat, getRawMacaroon, verifyMacaroonCaveats, expirationSatisfier } from './l402js'
import * as Macaroon from 'macaroon'
import { sha256 } from "js-sha256";
import * as fs from 'fs';
import { type Event as NostrEvent, relayInit } from 'nostr-tools';
import { createReadStream, writeFileSync, unlink } from 'fs'
import FormData from 'form-data';
import axios from "axios";

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
    const pub = pubrelay.publish(event);


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
