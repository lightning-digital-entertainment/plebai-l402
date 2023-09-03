import { createImage } from './genimage/createImage';
import * as dotenv from 'dotenv';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {publishRelays, readRandomRow} from './helpers'


dotenv.config();

const wordsArray = [' mjgrt', ' hande_ercel', ' Neh4Sh4rm4', ' ol1v1arodr1go', ' S113_PolinaSitnova', ' 0rnellamut1-130', ' Aish45h4rm4', '  <lora:elishacuthbert_smf_lora_02:0.5>', ' <lora:edgEgyptian_Doll:0.6>', '   <lora:karisa:0.5>', '  <lyco:Ketika SharmaV3:0.5>', '   <lyco:MarLucas-RealVision-V1.0:1.0>'];



export async function genPostImage() {


    try {

        const randomRow:string = readRandomRow(process.env.UPLOAD_PATH + 'bgprompts.csv');

        const promptInjection = randomRow.replace(/"/g, '') + process.env.BG1 + getRandomWord(wordsArray);

        const imageURL = await createImage(promptInjection, 512, 768, true);

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
            pubkey: getPublicKey(process.env.SK2),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content
        } as any;


        event.id = getEventHash(event);
        event.sig = getSignature(event, process.env.SK2);

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

const randomTime = getRandomInterval(60000, 900000); // between 1 to 3 minutes in milliseconds

const timerId = setInterval(() => {
    genPostImage();
}, randomTime);

function getRandomWord(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

console.log('The End');


