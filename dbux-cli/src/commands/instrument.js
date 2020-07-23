// import path from 'path';

import fs from 'fs';
// import path from 'path';
// import moduleAlias from 'module-alias';
// import process from 'process';
import prettier from 'prettier';
import { transformSync } from '@babel/core';

import dbuxBabelPlugin from '@dbux/babel-plugin';

import { wrapCommand } from '../util/commandUtil';

// pre-import dependencies that are not going to be in the target script
import '@babel/preset-env';
import buildDefaultBabelOptions from '../defaultBabelOptions';

export const command = 'instrument <file>';
export const aliases = [];
// export const describe = '';
export const builder = {
};


/**
 * Run file with dbux instrumentations (using babel-register).
 */
export const handler = wrapCommand(async ({ file }) => {
  const babelOptions = {
    ...buildDefaultBabelOptions(),
    sourceMaps: false,
    retainLines: true,
    plugins: [
      dbuxBabelPlugin
    ]
  };

  // preset-env by default converts to es5 -> so we delete it (for now)
  // WARNING: This will make it s.t. the code that `dbux run <file>` uses will be different from `dbux instrument <file>`
  delete babelOptions.presets;


  // const mergeWith from 'lodash/mergeWith');
  const inputCode = fs.readFileSync(file, 'utf8');

  console.log('Instrumenting file', file, '...');

  // console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
  const outputCode = transformSync(inputCode, babelOptions).code;

  console.log(
    prettier.format(outputCode)
  );
});

