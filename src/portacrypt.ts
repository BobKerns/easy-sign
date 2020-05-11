/**
 * @module PortaCrypt
 * Copyright © 2019 by Bob Kerns. Licensed under MIT license
 */

import {Base64, ByteBuffer} from "./base64";
/**
 * This module defines a compatibility layer for select crypto functions, with native
 * implementations in both browser and node.
 */

export const xthrow = (s: string): never => {
    throw new Error(s);
};

export interface IV extends Uint8Array {
    length: 16;
}

export interface Salt extends Uint8Array {
    length: 16;
}

export type RawKey = ByteBuffer<CryptoKey>;

type DebugInfo = any;

interface DebugInfoPair {
    public: DebugInfo;
    private: DebugInfo;
}
export interface SigningKeyPair {
    public: WrappedKey<PKeyType.PUBLIC>;
    private: WrappedKey<PKeyType.PRIVATE>;
    debug?: DebugInfoPair;
}

export enum PKeyType { PUBLIC = 'PUBLIC', PRIVATE = 'PRIVATE'};

export const PW_ITERATION_COUNT = 500000;
export const PW_KEY_LENGTH = 512;
export const PW_HASH = 'SHA-512';

/**
 * A format specific to this package, that captures the salt and IV necessary for decrypting
 * the string.
 */
export interface WrappedKey<T extends PKeyType> {
    type: T;
    iv: Base64<IV>,
    salt: Base64<Salt>,
    key: Base64<RawKey>
}

interface _PEM<T> {}
export type PEM<T> = string & _PEM<T>;

export type generateSigningKeysFn = (privatePassword: string, publicPassword: string) =>  Promise<SigningKeyPair>;
export type PUsage<T> = T extends 'PUBLIC' ? 'verify' : T extends 'PRIVATE' ? 'sign' : never;

export type unwrapSigningKeyFn = <T extends PKeyType>(wrapped: WrappedKey<T> | Base64<WrappedKey<T>>, usage: PUsage<T>) => (password: string) => CryptoKey;
export type packKeyFn = <T extends PKeyType>(unpacked: Base64<WrappedKey<T>> | WrappedKey<T>) => PEM<T>;


export interface PortaCrypt {
    generateSigningKeys:  generateSigningKeysFn;
    unwrapSigningKey: unwrapSigningKeyFn;

}
