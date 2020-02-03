/**
 * @module SampleCode Foobar is the Baz
 */
/**
 * This is a text description. Module comments have to be at the very start of the file.
 *
 * It has two paragraphs and a
 * @preferred
 */

import * as R from 'ramda';
export default function hello() {
    return R.map(a => a.toUpperCase(), "Hello, World!".split(/()/)).filter(a => /[^o,]/i.test(a)).join('');
}
