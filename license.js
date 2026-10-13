// Pure licensing logic (no Electron dependency) so it can be unit-tested with plain node.
const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ023456789';
const CODE_SALT = 'WHITEBOARD-ACT-v1|';
const MID_SALT = 'WHITEBOARD-MID-v1|';
const PUBLIC_JWK = { kty: 'RSA', n: 'm3Kr0b6IeR54v4BSK7jY1Ih8Z2g-1Evw-JklFWyDYfqxvyG2SGkIU3A6zfX2bmm-aLGc1ALfB4b5kqUd3plmAwx2rFqsZ5sTLVJdM2vQt-ygQF8V9I_D1xYEb4MDLSAmT6bl0tzb8WbAur2SIMCHlzelc7GHBKDaCEo404Ni8ek', e: 'AQAB' };

function normalize(s) {
  return String(s || '').toUpperCase().replace(/[-\s\t\r\n]/g, '');
}

function encodeChars(hash, count) {
  let out = '';
  for (let i = 0; i < count; i++) out += ALPHABET[hash[i] % 32];
  return out;
}

function group4(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    if (i > 0 && i % 4 === 0) out += '-';
    out += raw[i];
  }
  return out;
}

function machineSerial() {
  try {
    const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { timeout: 8000 }).toString();
    const m = out.match(/"IOPlatformSerialNumber" = "([^"]+)"/);
    if (m && m[1]) return m[1];
  } catch (e) { /* fall through to hostname fallback (also used on dev machines) */ }
  return os.hostname() + '|' + os.userInfo().username;
}

function getProductId() {
  const input = MID_SALT + machineSerial() + '|' + os.userInfo().username.toLowerCase();
  const h = crypto.createHash('sha256').update(input, 'utf8').digest();
  return group4(encodeChars(h, 8));
}

function base32Decode(s) {
  const val = new Array(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) val[ALPHABET.charCodeAt(i)] = i;
  const bytes = [];
  let buffer = 0, bits = 0;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    const v = code < 128 ? val[code] : -1;
    if (v < 0) throw new Error('bad character');
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return Buffer.from(bytes);
}

let publicKey = null;
function getPublicKey() {
  if (!publicKey) publicKey = crypto.createPublicKey({ key: PUBLIC_JWK, format: 'jwk' });
  return publicKey;
}

function verifyCodeFor(code, productId) {
  try {
    const norm = normalize(code);
    if (norm.length !== 205) return false;
    const sig = base32Decode(norm);
    if (sig.length !== 128) return false;
    const msg = Buffer.from(CODE_SALT + normalize(productId), 'utf8');
    return crypto.verify('sha256', msg, getPublicKey(), sig);
  } catch (e) {
    return false;
  }
}

module.exports = { normalize, getProductId, verifyCodeFor, base32Decode, ALPHABET };
