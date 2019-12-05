import pluginTester from 'babel-plugin-tester';
import plugin from '..';
import path from 'path';

//import { promises as fs } from 'fs';
import fs from 'fs';

const codeFolder = path.join(__dirname, '__code__');
const fpath = path.join(codeFolder, 'example/code.js');

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
  filename: __filename,
  tests: [
    {
      code,
      snapshot: true
    }
  ]
});