
import bolt11 from 'bolt11'
import assert from 'bsert'
import { MacaroonClass } from './types';
import * as Macaroon from 'macaroon'
import util from 'util';

let TextEncoder
if (typeof window !== 'undefined' && window && window.TextEncoder) {
  TextEncoder = window.TextEncoder;
} else {

  TextEncoder = util.TextEncoder;
}

export const utf8Encoder = new TextEncoder();
export const isValue = (x: string | null | undefined): boolean => x !== undefined && x !== null;
export const stringToBytes = (s: string | null | undefined): Uint8Array => isValue(s) ? utf8Encoder.encode(s) : null;


/**
 * @description Given a string, determine if it is in hex encoding or not.
 * @param {string} h - string to evaluate
 */
export function isHex(h: string): boolean {
  return Buffer.from(h, 'hex').toString('hex') === h
}

// A wrapper around bolt11's decode to handle
// simnet invoices
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decode(req: string): any {
  let network
  if (req.indexOf('lnsb') === 0)
    network = { bech32: 'sb'}
  return bolt11.decode(req, network)
}

export function getIdFromRequest(req: string): string {
  const request = decode(req)
  type Tag = {tagName: string, data?: string}
  const hashTag = request.tags.find((tag: Tag) => tag.tagName === 'payment_hash')
  assert(hashTag && hashTag.data, 'Could not find payment hash on invoice request')
  const paymentHash = hashTag?.data.toString()

  if (!paymentHash || !paymentHash.length)
    throw new Error('Could not get payment hash from payment request')

  return paymentHash
}
