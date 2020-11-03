
import '@dbux/common/src/util/prettyLogs';

import env from 'dotenv';
import fs from 'fs';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-server');

// read env file
env.config({ path: __dirname + '/../.env' });

const storageFolder = path.join(process.cwd(), process.env.STORAGE_FOLDER);
function checkFolderExist(uid) {
  let folder = path.join(storageFolder, uid);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  return folder;
}

export function upload(request, response) {
  let { uid, filename, data } = request.body;

  try {
    let folder = checkFolderExist(uid);
    fs.writeFileSync(path.join(folder, filename), Buffer.from(data));

    response.send('Done.');
  }
  catch (e) {
    response.status(500).send(e.stack);
  }
}
