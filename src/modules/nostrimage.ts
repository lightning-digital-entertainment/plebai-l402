import * as dotenv from 'dotenv';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {publishRelays, readRandomRow} from './helpers'
import { TextToImageRequest } from './getimage/text-to-image';
import { createGetImage, createGetImageWithPrompt } from './getimage/createText2Image';
import { createNIP94Event } from './nip94event/createEvent';
import { createSinkinImageWithPrompt } from './sinkin/createimage';
import { createTxt2ImgWithPrompt } from './randomseed/txt2img';


dotenv.config();



export async function genPostImage() {


    try {

        const prompt:string = readRandomRow(process.env.UPLOAD_PATH + 'imageprompts.csv');

        const imageURL = await createTxt2ImgWithPrompt(prompt + ' blacklight makeup', 'sdxl_base_1.0', 1024,768); // createSinkinImageWithPrompt(prompt + ' in portrait', '4zdwGOB');

        console.log('ImageGen: ' +prompt + ' ' + imageURL );


        if (imageURL === null) return;

        const content = "Prompt: " + prompt + "\n "  +  imageURL.output[0] + '\n #zapathon #bitcoin #nostr #plebchain #grownostr #zap #art #memes #pleb #PlebAI';

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

        await createNIP94Event(imageURL.output[0], null, content);

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

console.log('The End');


