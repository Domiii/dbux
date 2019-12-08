import path from 'path';

//import { promises as fs } from 'fs';
import fs from 'fs';
import { runSnapshotTests } from '../testing/test-util';

const codeFolder = path.join(__dirname, '__code__');

fs.readdirSync(codeFolder).forEach(fname => {
  //const fname = path.basename(fpath);
  const fpath = path.join(codeFolder, fname);
  const code = fs.readFileSync(fpath, { encoding: 'utf8' });

  expect(code).toBeString();
  
  runSnapshotTests(code, fpath, fname);
});