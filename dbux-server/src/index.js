import { newLogger } from '@dbux/common/src/log/logger';

import db, { firebase } from './db';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

(async function main() {
  // test DB connection
  const doc = await db.collection('test').doc('test1').get();

  debug('Successfully connected to DB!', doc.id, doc.data());
})();