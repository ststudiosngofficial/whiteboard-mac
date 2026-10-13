// Unit tests for license.js (run: node test-license.js <genuine-code> <pid-it-was-made-for>)
const assert = require('assert');
const L = require('./license');

const genuineCode = process.argv[2] || '';
const genuinePid = process.argv[3] || '';

// 1. Product ID format + determinism (hostname fallback on non-Mac dev machines)
const pid1 = L.getProductId();
const pid2 = L.getProductId();
assert.match(pid1, /^[ABCDEFGHJKMNPQRSTUVWXYZ023456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ023456789]{4}$/, 'PID format');
assert.strictEqual(pid1, pid2, 'PID deterministic');
console.log('PID_OK', pid1);

// 2. Genuine seller code verifies for its own PID
assert.ok(genuineCode, 'pass a genuine code as argv[2]');
assert.strictEqual(L.verifyCodeFor(genuineCode, genuinePid), true, 'genuine code accepted');
console.log('GENUINE_OK');

// 3. One-char tamper rejected
const t = (genuineCode[0] === 'A' ? 'B' : 'A') + genuineCode.slice(1);
assert.strictEqual(L.verifyCodeFor(t, genuinePid), false, 'tampered code rejected');
console.log('TAMPER_OK');

// 4. Genuine code for a different PID rejected
assert.strictEqual(L.verifyCodeFor(genuineCode, 'ZZZZ-ZZZZ'), false, 'wrong-machine code rejected');
console.log('WRONGMACHINE_OK');

// 5. Garbage rejected
assert.strictEqual(L.verifyCodeFor('AAAA-BBBB-CCCC', genuinePid), false, 'garbage rejected');
assert.strictEqual(L.verifyCodeFor('', genuinePid), false, 'empty rejected');
console.log('GARBAGE_OK');
console.log('ALL_LICENSE_TESTS_PASSED');
