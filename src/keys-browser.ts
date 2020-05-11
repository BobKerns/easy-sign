/**
 * @module Easy-Sign
 * Copyright © 2020 by Bob Kerns. Licensed under MIT license
 */

/**
 * Change to true for debugging.
 */
const DEBUG = false;

/**
 * Key Management for Easy Sign
 */

import {Base64, base64Decode, base64Encode, isBase64} from "./base64";
import {PW_ITERATION_COUNT, IV, PW_KEY_LENGTH, PEM, PKeyType, PUsage, Salt, SigningKeyPair, WrappedKey, PW_HASH} from "./portacrypt";

const makeSalt = () => crypto.getRandomValues(new Uint8Array(16)) as Salt;
const makeIV = () => crypto.getRandomValues(new Uint8Array(16)) as IV;

/*
 * Get some key material to use as input to the deriveKey method.
 * The key material is an internalized form of the password supplied by the user.
 */
const getKeyMaterial = async (password: string) => {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2", hash: PW_HASH },
        false,
        ["deriveBits", "deriveKey"]
    );
};
/*
  * Given some key material and some random salt
  * derive an AES-CBC key using PBKDF2.
  */
const deriveKey = async (keyMaterial: CryptoKey, salt: Salt) =>
    crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PW_ITERATION_COUNT,
            hash: PW_HASH
        },
        keyMaterial,
        { name: "AES-CBC", length: PW_KEY_LENGTH },
        true,
        ["wrapKey", "unwrapKey"]
    );


/**
 * Generate a signing key pair.
 * @param privatePassword Password to protect the private key
 * @param publicPassword Password to protect the public key
 */
export const generateSigningKeys = async (privatePassword: string, publicPassword: string):  Promise<SigningKeyPair> => {
  const prv_salt = makeSalt();
  const prv_iv = makeIV();
  const pub_salt = makeSalt();
  const pub_iv = makeIV();
  // This is our keypair. Now let's package them up in an encrypted container.
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign", "verify"]
  );

  /*
   * Wrap the given key.
   */
  const wrapCryptoKey = async (keyToWrap: CryptoKey, password: string, salt: Salt, iv: IV) => {
    // get the key encryption key
    const keyMaterial = await getKeyMaterial(password);
    const wrappingKey = await deriveKey(keyMaterial, salt);

    return crypto.subtle.wrapKey("jwk", keyToWrap, wrappingKey, {
      name: "AES-CBC",
      iv: iv
    } as AesCbcParams);
  };
  /*
   * Wrap each key
   */
  const pub = await wrapCryptoKey(keyPair.publicKey, publicPassword, pub_salt, pub_iv);
  const priv = await wrapCryptoKey(keyPair.privateKey, privatePassword, prv_salt, prv_iv);
  const config = (salt: Salt, iv: IV) => ({
    iv: base64Encode(iv),
    salt: base64Encode(salt)
  });
  return {
    private: {
      type: PKeyType.PRIVATE,
      ...config(prv_salt, prv_iv),
      key: base64Encode(new Uint8Array(priv))
    },
    public: {
      type: PKeyType.PUBLIC,
      ...config(pub_salt, pub_iv),
      key: base64Encode(new Uint8Array(pub))
    },
        ...DEBUG ?
            {
                debug: {
                    public: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
                    private: await crypto.subtle.exportKey('jwk', keyPair.privateKey)
                }
            } : {}
  };
};

/**
 * Unpack a key packaged as a string, returning a WrappedKey format key
 * @param packed
 */
export const unpackKey = <T extends PKeyType>(packed: Base64<WrappedKey<T>> | PEM<T> | WrappedKey<T>): WrappedKey<T> => {
    if (!isBase64(packed)) return packed;
    packed = packed.trim();
    const [pre, preType] = /^-----BEGIN ([A-Z]+) KEY-----/i.exec(packed) ?? [];
    const [post, postType] = /-----END ([A-Z]+) KEY-----$/i.exec(packed) ?? [];
    const type = preType?.toUpperCase();
    if (type != postType?.toUpperCase()) {
        throw new Error(
            `Mismatched key types: ${preType.toUpperCase()} vs ${postType.toUpperCase()}`
        );
    }
    const body = packed.substring(pre?.length ?? 0, packed.length - post?.length ?? 0).trim();
    const buf = base64Decode(body);
    const iv = base64Encode(new Uint8Array(buf, 0, 16));
    const salt = base64Encode(new Uint8Array(buf, 16, 16));
    const key = base64Encode(new Uint8Array(buf, 32));
    return { type, iv, salt, key } as WrappedKey<T>;
};

/**
 * Unwrap the signing key in two steps. The first step takes the encrypted key and usage,
 * and returns a function that accepts the password to decrypt the key.
 * @param wrapped A
 * @param usage
 */
export const unwrapSigningKey = <T extends PKeyType>(wrapped: WrappedKey<T> | Base64<WrappedKey<T>>, usage: PUsage<T>) => {
    const key = isBase64(wrapped) ? unpackKey(wrapped) : wrapped;

    if (usage !== 'sign' && usage !== 'verify') {
        throw new Error(`Usage argument must be either 'sign' or 'verify', but we got ${usage}.`);
    }
    return (password: string) => {
        /*
         * Derive an AES-GCM key using PBKDF2.
         */
        const getUnwrappingKey = async () => {
            const keyMaterial = await getKeyMaterial(password);
            // 3 derive the key from key material and salt
            return crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: base64Decode(key.salt),
                    iterations: 500000,
                    hash: "SHA-384"
                },
                keyMaterial,
                { name: "AES-CBC", length: 256 },
                true,
                ["wrapKey", "unwrapKey"]
            );
        };

        /*
         * Unwrap an RSA-PSS private signing key from an Uint8Array containing the raw bytes.
         * Takes an array containing the bytes, and returns a Promise
         * that will resolve to a CryptoKey representing the private key.
         */
        const unwrapKey = async (wrappedKey: WrappedKey<T>) => {
            // 1. get the unwrapping key
            const unwrappingKey = await getUnwrappingKey();
            return crypto.subtle.unwrapKey(
                "jwk", // import format
                base64Decode(wrappedKey.key), // Encoded bytes representing key to unwrap
                unwrappingKey, // CryptoKey representing key encryption key
                {
                    name: "AES-CBC",
                    iv: base64Decode(key.iv)
                } as AesCbcParams,
                {
                    name: "ECDSA",
                    namedCurve: "P-384"
                } as EcKeyImportParams,
                true, // extractability of key to unwrap
                [usage] // key usages for key to unwrap
            );
        };
        return unwrapKey(key);
    };
};

export const packKey = <T extends PKeyType>(unpacked: Base64<WrappedKey<T>> | WrappedKey<T>): PEM<T> => {
    if (isBase64(unpacked)) return unpacked.trim();
    const iv = new Uint8Array(base64Decode(unpacked.iv));
    const salt = new Uint8Array(base64Decode(unpacked.salt));
    const key = new Uint8Array(base64Decode(unpacked.key));
    const buf = new Uint8Array(32 + key.length);
    iv.forEach((v, i) => (buf[i] = v));
    salt.forEach((v, i) => (buf[i + 16] = v));
    key.forEach((v, i) => (buf[i + 32] = v));
    return `-----BEGIN ${unpacked.type} KEY-----
${base64Encode(buf)}
-----END ${unpacked.type} KEY-----
`;
};
