
import bodyParser from "body-parser";
import express from "express";
import '@dbux/common/src/util/prettyLogs';
import { newLogger } from '@dbux/common/src/log/logger';
import db, { firebase } from './db';
import { login as loginRoute } from "./routes/login";
import { upload as uploadRoute } from "./routes/upload";

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-server');

(async function main() {
  // test DB connection
  const doc = await db.collection('test').doc('test1').get();

  debug('Successfully connected to DB!', doc.id, doc.data());
})();

const app = express();
const port = 2719;

app.use(bodyParser.json({ limit: '1gb' }));

app.get('/custom-token', loginRoute);

app.post('/upload', uploadRoute);

app.listen(port, () => {
  debug(`Express is listening on http://localhost:${port}.`);
});