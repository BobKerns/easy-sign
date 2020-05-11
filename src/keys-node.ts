/**
 * @module StatusMonitor
 * Copyright © 2019 by Bob Kerns. Licensed under MIT license
 */

/**
 *
 */

const DEBUG = false;

import crypto from 'crypto';
import {promisify} from 'util';

import {generateSigningKeysFn, IV, PortaCrypt, Salt, unwrapSigningKeyFn, xthrow, PW_KEY_LENGTH, PW_ITERATION_COUNT, PW_HASH, SigningKeyPair, PKeyType} from "./portacrypt";
import {base64Encode} from "./base64";

const dummy = <T>(name: string) => ((() => xthrow(`Function ${name} is not yet defined`)) as any as T);

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);
const createKeyPair = promisify(crypto.generateKeyPair);

const makeIV = () => randomBytes(16) as Promise<IV>;
const makeSalt = () => randomBytes(16) as Promise<Salt>;

const createKey = async (password: string, salt: Salt) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(password);
    const buffer = await pbkdf2(password, salt, PW_ITERATION_COUNT, PW_KEY_LENGTH, PW_HASH);
    return Uint8Array.from(buffer);
};

export const generateSigningKeys = async (privatePassword: string, publicPassword: string):  Promise<SigningKeyPair> => {
    const prv_salt = await makeSalt();
    const prv_iv = await makeIV();
    const pub_salt = await makeSalt();
    const pub_iv = await makeIV();
    // This is our keypair. Now let's package them up in an encrypted container.
    const {publicKey: pub, privateKey: priv} = await createKeyPair("ec", {namedCurve: 'P-384'});
    const config = (salt: Salt, iv: IV) => ({
        iv: base64Encode(iv),
        salt: base64Encode(salt)
    });
    return {
        private: {
            type: PKeyType.PRIVATE,
            ...config(prv_salt, prv_iv),
            key: base64Encode(new Uint8Array(priv.export({type: 'pkcs8', format: 'der'})))
        },
        public: {
            type: PKeyType.PUBLIC,
            ...config(pub_salt, pub_iv),
            key: base64Encode(new Uint8Array(pub.export({type: 'spki', format: 'der'})))
        },
        ...DEBUG ?
            {
                debug: {
                    public: pub,
                    private: priv
                }
            } : {}
    };
};

export const unwrapSigningKey: unwrapSigningKeyFn = dummy('unwrapSigingKey');
export default {
    generateSigningKeys,
    unwrapSigningKey
};
