import { createImage } from './genimage/createImage';
import * as dotenv from 'dotenv';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {publishRelays, readRandomRow} from './helpers'


dotenv.config();



export async function genPostImage() {


    try {

        const randomRow:string = readRandomRow(process.env.UPLOAD_PATH + 'imageprompts.csv');
        const imageURL = await createImage(randomRow.replace(/"/g, ''), 512, 768, true);

        if (imageURL === null) return;

        const content = "Prompt: " + randomRow + "\n "  +  imageURL + '\n #zapathon #bitcoin #nostr #plebchain #grownostr #zap #art #memes #pleb #PlebAI';

        const tags:string[][] = [];
        tags.push(['t', 'zapathon']);
        tags.push(['t', 'plebchain']);
        tags.push(['t', 'grownostr']);
        tags.push(['t', 'aiart']);
        tags.push(['t', 'plebai']);
        tags.push(['t', 'memes']);
        tags.push(['t', 'zap']);
        tags.push(['t', 'pleb']);

        // tags.push();

        const event: NostrEvent = {
            kind: 1,
            pubkey: getPublicKey(process.env.SK1),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content
        } as any;


        event.id = getEventHash(event);
        event.sig = getSignature(event, process.env.SK1);

        console.log(event);

        publishRelays(event);

    } catch (error) {

        console.log('In catch with error: ', error)

    }



}

// genPostImage();

function getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomTime = getRandomInterval(900000, 1800000); // between 1 to 3 minutes in milliseconds

const timerId = setInterval(() => {
    genPostImage();
}, randomTime);

console.log('The End');


