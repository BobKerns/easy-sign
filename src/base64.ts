/**
 * @module Easy-Sign
 * Copyright © 2020 by Bob Kerns. Licensed under MIT license
 */

/**
 * Convert to/from Base64
 */

interface _char64{}

type char64 = number &  _char64;

/**
 * A Uint8Array, with type info that lets us convey the type of data encoded in the array.
 */
export interface ByteBuffer<ENC> extends Uint8Array {}

/**
 * Marker interface
 */
interface _base64<ENC>{}

/**
 * A string, but with type info that lets us convey the type of data encoded in the string.
 */
export type Base64<ENC extends any> = string & _base64<ENC>;

/**
 * Typescript type guard; distinguishes betwween a Base64 string and the encoded value (for which there
 * is no reason for it to be a string.
 * Does *not* validate Base64 encoding; it is only a type discriminant.
 * @param v Either a Base64<ENC> string, or the ENC value itself.
 */
export const isBase64 = <ENC extends any>(v: Base64<ENC> | ENC): v is Base64<ENC> => (typeof v === 'string');

/**
 * Encode a Uint8Array into a base64 string.
 * @param buf a Uint8Array as ByteBuffer<ENC>
 * @param fold if true, include a CRLF every 76 chars.
 * @return Base64<ENC> encoded string
 */
export const base64Encode = <ENC extends any>(buf: ByteBuffer<ENC>, fold: boolean = false): Base64<ENC> => {
    const uint6ToB64 = (nUint6: number): char64 =>
        nUint6 < 26
            ? nUint6 + 65
            : nUint6 < 52
            ? nUint6 + 71
            : nUint6 < 62
                ? nUint6 - 4
                : nUint6 === 62
                    ? 43
                    : nUint6 === 63
                        ? 47
                        : 65;

    let out = "";

    const outLen = buf.length;
    let int24 = 0;
    for (let idx = 0; idx < outLen; idx++) {
        const mod3 = idx % 3;
        if (fold) {
            if (idx > 0 && ((idx * 4) / 3) % 76 === 0) {
                out += "\r\n";
            }
        }

        int24 |= buf[idx] << ((16 >>> mod3) & 24);
        if (mod3 === 2) {
            out += String.fromCharCode(
                uint6ToB64((int24 >>> 18) & 63),
                uint6ToB64((int24 >>> 12) & 63),
                uint6ToB64((int24 >>> 6) & 63),
                uint6ToB64(int24 & 63)
            );
            int24 = 0;
        }
        if (outLen - idx === 1) {
            switch (mod3) {
                case 0:
                return out + String.fromCharCode(
                    uint6ToB64((int24 >>> 18) & 63),
                    uint6ToB64((int24 >>> 12) & 63))
                    + '==';
                case 1:
                    return out + String.fromCharCode(
                        uint6ToB64((int24 >>> 18) & 63),
                        uint6ToB64((int24 >>> 12) & 63),
                        uint6ToB64((int24 >>> 6) & 63))
                        + '=';
                case 2:
                    return out;
            }
        }
    }
    return out;
};

/**
 * Decode a Base64<ENC> string, getting back Uint8Array typed as ByteBuffer<...>
 * @param str Input string
 */
export const base64Decode = <ENC extends any>(str: Base64<ENC>): ByteBuffer<ENC> => {
    if (!/^\s*[A-Za-z0-9+\/\s\n\t\r]+={0,2}\s*$|^\s*$/.test(str)) {
        throw new Error('Illegal character in base64 string.')
    }
    str = str.replace(/[^A-Za-z0-9+\/]/g, ""); // Removes padding, internal whitespace (e.g. line folding, indentation).
    const b64ToUint6 = (nChr: char64) =>
        nChr > 64 && nChr < 91
            ? nChr - 65
            : nChr > 96 && nChr < 123
            ? nChr - 71
            : nChr > 47 && nChr < 58
                ? nChr + 4
                : nChr === 43
                    ? 62
                    : nChr === 47
                        ? 63
                        : 0;

    const inLen = str.length;
    const nOutLen = Math.floor((inLen * 3) / 4);
    const out = new Uint8Array(nOutLen) as ByteBuffer<ENC>;
    for (
        let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0;
        nInIdx < inLen;
        nInIdx++
    ) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(str.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
        if (nMod4 === 3 || inLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                out[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
            }
            nUint24 = 0;
        }
    }
    return out;
};
