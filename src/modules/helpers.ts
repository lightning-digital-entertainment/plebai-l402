import { LightningAddress } from "alby-tools";
import { InvoiceResponse } from "../typings/invoice";
import { Lsat, Identifier, Caveat, getRawMacaroon, verifyMacaroonCaveats, expirationSatisfier } from './l402js'
import * as Macaroon from 'macaroon'
import { sha256 } from "js-sha256";

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


