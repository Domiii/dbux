
import '@dbux/common/src/util/prettyLogs';

import env from 'dotenv';
import fs from 'fs';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import checkGithubToken from '../utils/github';
import { zipToFile } from '../utils/zip';

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

export async function upload(request, response) {
  let { githubToken, filename, data } = request.body;

  // check github access token works
  let user = await checkGithubToken(githubToken);

  try {
    let folder = checkFolderExist(user.login);
    zipToFile(data, filename, path.join(folder, `${filename}.zip`));

    response.send('Done.');
  }
  catch (e) {
    response.status(500).send(e.stack);
  }
}
