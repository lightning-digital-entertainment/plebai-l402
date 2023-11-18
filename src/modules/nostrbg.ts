import { createImage } from './genimage/createImage';
import * as dotenv from 'dotenv';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {getImageUrlFromFile, publishRelays, readRandomRow} from './helpers'
import * as fs from 'fs';
import { createNIP94Event } from './nip94event/createEvent';


dotenv.config();

async function genPostImage() {


    try {

        let imageURL=null
        const dir = '/home/ubuntu/desiphotos/';
        fs.readdir(dir, async (err, files) => {
            if (err) {
                console.error('Error reading the directory:', err);
                return;
            }

            const randomIndex = Math.floor(Math.random() * files.length);
            const randomFile = files[randomIndex];

            console.log('Randome file: ', dir+randomFile)

             imageURL = await getImageUrlFromFile(dir,randomFile);

             console.log(imageURL)


            const content = imageURL + '\n #zapathon #bitcoin #nostr #plebchain #grownostr #zap #art #memes #pleb #PlebAI';

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
                pubkey: getPublicKey(process.env.SK2),
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content
            } as any;


            event.id = getEventHash(event);
            event.sig = getSignature(event, process.env.SK2);

            console.log(event);

            publishRelays(event);

            await createNIP94Event(imageURL, null, '');

        });


    } catch (error) {

        console.log('In catch with error: ', error)

    }



}

// genPostImage();


function getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomTime = getRandomInterval(30000000, 36000000); // between 1 to 3 minutes in milliseconds

const timerId = setInterval(() => {
    genPostImage();
}, randomTime);

function getRandomWord(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

console.log('The End');


