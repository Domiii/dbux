
import '@dbux/common/src/util/prettyLogs';
import { fetchGET } from '@dbux/projects/src/util/fetch';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-server.github');

export default async function checkGithubToken(token) {
  try {
    await fetchGET('https://api.github.com/user', null, { headers: { Authorization: `token ${token}` } });
  }
  catch (err) {
    throw new Error(`Github access token failed: ${err.message}`);
  }
}