import pluginTester from 'babel-plugin-tester';
import plugin from '..';
import path from 'path';

//import { promises as fs } from 'fs';
import fs from 'fs';

const codeFolder = path.join(__dirname, '__code__');

const fname = 'example1.js';
const fpath = path.join(codeFolder, fname);

let code;

// beforeAll(() => {
  code = fs.readFileSync(fpath, { encoding: 'utf8' });

  expect(code).toBeString();
// });


pluginTester({
  plugin,
  pluginName: 'dbux-babel-plugin',
  babelOptions: {
    configFile: path.join(__dirname, '../../babel.config.js'),
  },
  filename: fpath,
  tests: [
    {
      title: fname,
      code,
      snapshot: true
    }
  ]
});