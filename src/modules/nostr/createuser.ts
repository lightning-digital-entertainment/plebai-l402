import { generatePrivateKey, getPublicKey } from "nostr-tools";
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { utf8Encoder } from "../l402js/helpers";
import { EncryptedData, encrypt } from "../helpers";



export async function createNostrUser(title:string):Promise<any> {


            console.log('Agent title: ', title);
            const username = title.replace(/\s/g, "").replace("-", "_").toLowerCase()+ "@plebai.com";
            const privateKey = generatePrivateKey();
            console.log(privateKey);
            console.log('nip: ',  username)
            const pubkey = getPublicKey(privateKey);
            const password = secp256k1.utils .bytesToHex(
                sha256(utf8Encoder.encode(privateKey)),
            );


            const body = JSON.stringify({
                login: pubkey ,
                password,
                username
              });


            const postUser = await fetch(process.env.CURRENT_API_HOST + `/v2/users`, {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                     },
                })

            const postUserJson: any = await postUser.json()
            console.log(postUserJson);

            if (postUserJson?.login !== pubkey) return null;


            const encryptedKey:EncryptedData = encrypt(privateKey, process.env.UNLOCK_KEY );

            return ({
                nip05: username,
                key_iv: encryptedKey.iv,
                key_content: encryptedKey.content

            })





}