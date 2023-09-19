import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature} from 'nostr-tools';
import * as crypto from 'crypto';
import axios from 'axios';
import { publishRelays } from '../helpers';
import sizeOf from 'image-size';


export async function createNIP94Event(imageUrl:string, ptag:string, content:string): Promise<boolean> {

    const tags:string[][] = [];
    tags.push(['url', imageUrl]);

    const { size, type, width, height } = await getFileAndImageDetailsFromUrl(imageUrl);
    const imageHash = await computeSHA256ForURL(imageUrl);

    tags.push(['size', size.toString(10)]);
    tags.push(['dim', width + 'x' + height]);
    tags.push(['m', type]);
    tags.push(['x', imageHash]);

    if (ptag !== null) tags.push(['p', ptag]);




    const eventNip94: NostrEvent = {
        kind: 1063,
        pubkey: getPublicKey(process.env.SK1),
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content
    } as any;


    eventNip94.id = getEventHash(eventNip94);
    eventNip94.sig = getSignature(eventNip94, process.env.SK1);

    console.log('1063 Event: ', eventNip94);

    publishRelays(eventNip94);


    return true;
}

async function getFileAndImageDetailsFromUrl(url: string): Promise<{ size: number, type: string, width: number, height: number }> {
    try {
        // Fetch headers using a HEAD request
        const headResponse = await axios.head(url);

        // Extract headers
        const size = parseInt(headResponse.headers['content-length'] || '0', 10);
        const type = headResponse.headers['content-type'] || 'unknown';

        // Get image data
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        // Use the image-size library to get dimensions
        const dimensions = sizeOf(Buffer.from(response.data));

        return {
            size,
            type,
            width: dimensions.width,
            height: dimensions.height
        };
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

export async function sizeOver1024(url:string): Promise<boolean> {


        try {

            if (url === null) return false;

            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const dimensions = sizeOf(Buffer.from(response.data));

            if (dimensions.width > 1025) return true;
            if (dimensions.height > 1025) return true;



        } catch (error) {

            console.log(error)

        }

        return false;

}

async function computeSHA256ForURL(url: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const hash = crypto.createHash('sha256');

        try {
            const response = await axios.get(url, {
                responseType: 'stream'
            });

            response.data.on('data', (chunk: Buffer) => {
                hash.update(chunk);
            });

            response.data.on('end', () => {
                resolve(hash.digest('hex'));
            });

            response.data.on('error', (error: Error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}