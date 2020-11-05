
import fs from 'fs';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';

import { fetchPOST } from './util/fetch';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('file upload');

const baseUrl = 'http://linux8.csie.org';
const port = 2719;
const url = `${baseUrl}:${port}/upload`;

export default async function upload(uid, filepath) {
  let data = fs.readFileSync(filepath);
  let filename = path.basename(filepath);
  return fetchPOST(url, { uid, filename, data }, undefined, undefined, { raw: true });
}