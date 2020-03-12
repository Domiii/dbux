import path from 'path';

//import { promises as fs } from 'fs';
import fs from 'fs';
import { runSnapshotTests } from '../testing/test-util';

const pluginRoot = path.join(__dirname, '../..');
const dbuxRoot = path.join(pluginRoot, '..');
const inputFolder = path.join(dbuxRoot, 'samples/__samplesInput__');

fs.readdirSync(inputFolder).forEach(fname => {
  //const fname = path.basename(fpath);
  const fpath = path.join(inputFolder, fname);
  if (fs.lstatSync(fpath).isFile()) {
    const code = fs.readFileSync(fpath, { encoding: 'utf8' });
    expect(code).toBeString();

    runSnapshotTests(code, fpath, fname, true, {});
  }
});