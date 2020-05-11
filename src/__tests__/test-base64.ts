/**
 * @module Easy-Sign
 * Copyright © 2020 by Bob Kerns. Licensed under MIT license
 */

/**
 * Tests for base64 conversion. It seems rolling my own is the best way to get one that works correctly everywhere, sigh.
 * Yeah, the padding bit is confusing, but seriously?
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

class Mappable<T, TReturn=any, TNext=undefined> implements IterableIterator<T> {
    _iter: Iterator<T, TReturn, TNext>;
    constructor(iter: Iterator<T, TReturn, TNext>) {
        this._iter = iter;
    }
    [Symbol.iterator]() { return this; }
    next(arg: any) { return this._iter.next(arg); }
    return(v?: any) { return this._iter.return?.(v) ?? {done: true, value: v}; }
    throw(e?: any) { return this._iter.throw?.(e) ?? {done: true, value: e}; }
    forEach(fn: (v: T, i: number) => any) {
        let idx = 0;
        for (let v of this) {
            fn(v, idx);
        }
    }
    map<R>(fn: (v: T, i: number) => R): Array<R> {
        const r: Array<R> = [];
        this.forEach((v, i) => {
            r.push(fn(v, i));
        });
        return r;
    }
}

const range = (min: number, max: number = min + 1, step: number = min < max ? 1 : -1) => {
    function* rangeGen(min: number, max: number, step: number) {
        if (min < max) {
            for (let i = min; i < max; i += step) {
                yield i;
            }
        } else {
            for (let i = min; i < max; i += step) {
                yield i;
            }
        }
    }
    return new Mappable(rangeGen(min, max, step));
};

import {base64Decode, base64Encode} from "../base64";

describe("Base64", () => {

    describe('Basic encode tests', () => {
        test('empty', () => {
            expect(base64Encode(Uint8Array.of())).toEqual('');
        });
        test('0 x 1', () => {
            expect(base64Encode(Uint8Array.of(0))).toEqual('AA==');
        });
        test('0 x 2', () => {
            expect(base64Encode(Uint8Array.of(0, 0))).toEqual('AAA=');
        });
        test('/w', () => expect(base64Encode(Uint8Array.of(255))).toEqual('/w=='));
        test('/wA', () => expect(base64Encode(Uint8Array.of(255, 0))).toEqual('/wA='));
        describe('byte values', () =>
            test.each(range(0, 64).map((v, i):[number, string, number] => [v, CHARS[v], i]))(`byte val %i %s`, (ch: number, chr: string) =>
                expect(base64Encode(Uint8Array.of(0, 0, ch))).toEqual('AAA' + chr)));
    });

    describe('Basic decode tests', () => {
        test('empty', () =>
            expect(base64Decode("")).toEqual(Uint8Array.of())
        );
        test('0 x 1', () =>
            expect(base64Decode("AA==")).toEqual(Uint8Array.of(0))
        );
        test('0 x 2', () =>
            expect(base64Decode('AAA=')).toEqual(Uint8Array.of(0, 0))
        );
        test('/w', () => expect(base64Decode('/w')).toEqual(Uint8Array.of(255)));
        test('/wA', () => expect(base64Decode('/wA')).toEqual(Uint8Array.of(255, 0)));
        describe('char values', () =>
            test.each(range(0, 64).map((v, i): [number, string, number] => [v, CHARS[v], i]))('char val %i %s', (ch, chr) =>
                expect(base64Decode('AAA' + chr)).toEqual(Uint8Array.of(0, 0, ch))));
    });

    describe('Padding tests', () => {
        test('convert empty', () => {
            // Zero length
            const bytes = Uint8Array.of();
            const encoded = base64Encode(bytes);
            expect(encoded.length).toEqual(0);
            expect(encoded).toMatch(/^[a-zA-Z0-9\/+]*$/)
        });
        test('convert 0 mod 3', () => {
            // Multiple of 3 in length
            const bytes = Uint8Array.of(...[..."foobar"].map(c => c.charCodeAt(0)));
            const encoded = base64Encode(bytes);
            expect(encoded.length).toEqual(8);
            expect(encoded).toMatch(/^[a-zA-Z0-9\/+]*$/)
        });
        test('convert 1 mod 3', () => {
            // Multiple of 3 + 1 in length
            const bytes = Uint8Array.of(...[..."fooXbar"].map(c => c.charCodeAt(0)));
            const encoded = base64Encode(bytes);
            expect(encoded.length).toEqual(12);
            expect(encoded).toMatch(/^[a-zA-Z0-9\/+]*==$/)
        });
        test('convert 2 mod 3', () => {
            // Multiple of 3 + 2 in length
            const bytes = Uint8Array.of(...[..."fooXYbar"].map(c => c.charCodeAt(0)));
            const encoded = base64Encode(bytes);
            expect(encoded.length).toEqual(12);
            expect(encoded).toMatch(/^[a-zA-Z0-9\/+]*=$/)
        });
        test('convert 0 mod 3 next', () => {
            // Multiple of 3 + 2 in length
            const bytes = Uint8Array.of(...[..."fooXYZbar"].map(c => c.charCodeAt(0)));
            const encoded = base64Encode(bytes);
            expect(encoded.length).toEqual(12);
            expect(encoded).toMatch(/^[a-zA-Z0-9\/+]*$/)
        });
    });

    describe('Round-trip tests', () => {
        const roundTrip = (str: string) => {
            // Multiple of 3 in length
            const bytes = Uint8Array.of(...[...str].map(c => c.charCodeAt(0)));
            const encoded = base64Encode(bytes);
            const decoded = base64Decode(encoded);
            return [...new Uint8Array(decoded)].map(c => String.fromCharCode(c)).join('');
        };
        test('round trip 0 mod 3', () => {
            // Multiple of 3 in length
            const str = roundTrip('foobar');
            expect(str).toEqual("foobar");
        });
        test('round trip 1 mod 3', () => {
            // Multiple of 3 + 1 in length
            const str = roundTrip('fooXbar');
            expect(str).toEqual("fooXbar");
        });
        test('round trip 2 mod 3', () => {
            // Multiple of 3 + 2 in length
            const str = roundTrip('fooXYbar');
            expect(str).toEqual("fooXYbar");
        });
        test('round trip 0 mod 3 next', () => {
            // Multiple of 3 + 2 in length
            const str = roundTrip('fooXYZbar');
            expect(str).toEqual("fooXYZbar");
        });
    });
    describe("Error tests", () => {
        test("Bad char", () =>
            expect(() => base64Decode('AAAA.AAAA')).toThrow(/illegal/i)
        );

        test("Bad pad", () =>
            expect(() => base64Decode('AAAA=AAAA')).toThrow(/illegal/i)
        );

        test("Too many pad", () =>
            expect(() => base64Decode('AAAAAAAA===')).toThrow(/illegal/i)
        );
    });
    describe('Whitespace', () => {
        test('Oddly-placed newline', () =>
            expect(base64Decode('AAA\nAAAAA')).toEqual(Uint8Array.of(0, 0, 0, 0, 0, 0))
        );
        test('Interior space', () =>
            expect(base64Decode('AAA AAA\tAA')).toEqual(Uint8Array.of(0, 0, 0, 0, 0, 0))
        );
        test('Exterior space', () =>
            expect(base64Decode(' \tAAAAAAAA\n  ')).toEqual(Uint8Array.of(0, 0, 0, 0, 0, 0))
        );
    });
});
