import dbuxRunFile from '@dbux/cli/src/dbuxRunFile';
import path from 'path';

const srcFolder = path.join(__dirname, '..');
const samplesFolder = path.join(srcFolder, '..');
const inputFolder = path.join(samplesFolder, '__samplesInput__');

export default function runSample(name, performTests) {
  test(name, () => {
    const fpath = path.join(inputFolder, name);
    dbuxRunFile(fpath);


    // NOTE: dbux runtime is injected as a global variable through `registerDbuxAsGlobal`
    const dbuxRuntime = global.__dbux;

    performTests(dbuxRuntime);
  });
}