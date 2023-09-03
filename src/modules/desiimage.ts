import { createImage } from './genimage/createImage';
import * as dotenv from 'dotenv';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {publishRelays, readRandomRow} from './helpers'


dotenv.config();

const getRandomElement = (arr: string[]): string => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}


async function genPostImage() {


    try {

        // const randomRow:string = readRandomRow(process.env.UPLOAD_PATH + 'imageprompts.csv');


        const input1: string[] = ['close up', 'upper body']
        const input2: string[] = ['indianasin <lora:asin_model:0.5>', 'trisha  <lora:trisha_model:0.5>', 'trisha  <lora:trisha_model:0.5> <lyco:MarLucas-RealVision-V1.0:0.8>', 'arao <lora:Amrita_Rao_SD15_LoRA:0.5>', '<lora:pranalira:0.5>', ' karisa <lora:karisa:0.5>', 'ketika  <lyco:Ketika SharmaV3:0.5>', '<lyco:MarLucas-RealVision-V1.0:0.8>', 'ketika  <lyco:Ketika SharmaV3:0.5> <lora:trisha_model:0.5>']
        const input3: string[] = ['small', 'busty']
        const input4: string[] = ['red', 'green', 'violet', 'pink']

        let randomRow:string = '{input1} of a {input2} indian  woman  goddess, who looks at you in a Demandingly way with two beautiful green eyes , {input3} breasts,  {input4} saree, very seductive pose, necklace, jewelry, upper body,  outdoor, night, restaurant, attractive pose, red lips, sexy girl, gorgeous lady, lovely woman, gorgeous woman ';
        randomRow = randomRow.replace('{input1}', getRandomElement(input1))
        randomRow = randomRow.replace('{input2}', getRandomElement(input2))
        randomRow = randomRow.replace('{input3}', getRandomElement(input3))
        randomRow = randomRow.replace('{input4}', getRandomElement(input4))

        console.log('Prompt: ', randomRow);

        const imageURL = await createImage(randomRow.replace(/"/g, ''), 512, 768, true);

        if (imageURL === null) return;

        const content = imageURL + '\n #ai #zap #art #memes #pleb #PlebAI';

        const tags:string[][] = [];
        tags.push(['t', 'aiart']);
        tags.push(['t', 'memes']);
        tags.push(['t', 'PlebAI']);
        tags.push(['t', 'Images']);



        // tags.push();

        const event: NostrEvent = {
            kind: 1,
            pubkey: getPublicKey(process.env.SK3),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content
        } as any;


        event.id = getEventHash(event);
        event.sig = getSignature(event, process.env.SK3);

        console.log(event);

        publishRelays(event);

        const tags2:string[][] = [];
        tags2.push(['url', imageURL]);
        tags2.push([ 'm', 'image/png' ]);
        tags2.push([ 'dim', '512x768' ]);




        /*
        const description_hash =  Buffer.from('u._hash(req.query.nostr)', 'hex').toString('base64');
        const nip94event: NostrEvent = {
            kind: 1063,
            pubkey: getPublicKey(process.env.SK3),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content:''
        } as any;


        event.id = getEventHash(nip94event);
        event.sig = getSignature(nip94event, process.env.SK3);

        console.log(nip94event);

        publishRelays(nip94event);
        */



    } catch (error) {

        console.log('In catch with error: ', error)

    }



}

genPostImage();

function getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomTime = getRandomInterval(600000, 900000); // between 1 to 3 minutes in milliseconds

const timerId = setInterval(() => {
    genPostImage();
}, randomTime);

console.log('The End');


