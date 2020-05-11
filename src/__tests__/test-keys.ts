/**
 * @module Easy-Sign
 * Copyright © 2020 by Bob Kerns. Licensed under MIT license
 */

/**
 * Tests of key management
 */

import {generateSigningKeys} from "../keys-node";

describe('Keys', () => {
   test('KeyPair', async () => {
       const kp = await generateSigningKeys('pass1', 'pass2');
       expect(kp).toBeInstanceOf(Object);
       expect(kp).toHaveProperty('public');
       expect(kp).toHaveProperty('private');
       expect(kp.public).toBeInstanceOf(Object);
       expect(kp.private).toBeInstanceOf(Object);
   })
});
