import { _require } from '@dbux/common/src/util/universalLibs';

/**
 * Recommended compatability check
 * @see https://nodejs.org/api/crypto.html
 */
let crypto;
try {
  crypto = _require('crypto');
} catch (err) {
  console.error('Crypto not supported in this version of node!');
}

/**
 * @see https://stackoverflow.com/a/27970509
 */
export function sha256String(data, encoding = 'utf8') {
  if (!crypto) {
    throw new Error('Crypto not supported in this version of node!');
  }
  return crypto.createHash('sha256').update(data, encoding).digest('hex');
}