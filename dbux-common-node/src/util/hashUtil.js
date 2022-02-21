import fs from 'fs';
import { crypto } from '@dbux/common/src/util/universalLib';
import NestedError from '@dbux/common/src/NestedError';


/**
 * @see https://stackoverflow.com/a/27970509
 */
export function sha256String(data, encoding = 'utf8') {
  if (!crypto) {
    throw new Error('Crypto not supported in this version of node!');
  }
  return crypto.createHash('sha256').update(data, encoding).digest('hex');
}

/**
 * @see https://github.com/so-ta/sha256-file/blob/master/index.js
 */
export async function sha256File(fpath) {
  if (!crypto) {
    throw new Error('Crypto not supported in this version of node!');
  }
  const sum = crypto.createHash('sha256');
  const fileStream = fs.createReadStream(fpath);
  return new Promise((resolve, reject) => {
    fileStream.on('error', function (err) {
      reject(new NestedError(`Failed to read file in sha256file`, err));
    });
    fileStream.on('data', function (chunk) {
      try {
        sum.update(chunk);
      } catch (err) {
        reject(new NestedError(`Failed to update hash in sha256file`, err));
      }
    });
    fileStream.on('end', function () {
      resolve(sum.digest('hex'));
    });
  });
}