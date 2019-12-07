import path from 'path';

//import { promises as fs } from 'fs';
import fs from 'fs';
import { runSnapshotTest } from '../testing/test-util';

const codeFolder = path.join(__dirname, '__code__');

const fname = 'example1.js';
const fpath = path.join(codeFolder, fname);

let code;

// beforeAll(() => {
code = fs.readFileSync(fpath, { encoding: 'utf8' });

expect(code).toBeString();
// });
// debugger;
runSnapshotTest(code, fpath, fname);