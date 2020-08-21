// import path from 'path';

import fs from 'fs';
import prettier from 'prettier';
import { transformSync } from '@babel/core';

import { wrapCommand } from '../util/commandUtil';
import { processEnv } from '../util/processEnv';

// pre-import dependencies that are not going to be in the target script
import buildBabelOptions from '../util/buildBabelOptions';
import { buildCommonCommandOptions, resolveCommandTargetPath } from '../commandCommons';

export const command = 'instrument <file>';
export const aliases = ['i'];
export const describe = `Instrument file with dbux and print resulting code.
  NOTE: If you want to investigate the result in VSCode you can use 'dbux instrument myFile.js | code -'`;

export const builder = {
  ...buildCommonCommandOptions(),
  // quiet: {
  //   alias: ['q'],
  //   default: false,
  //   type: 'boolean'
  // }
};


/**
 * Run file with dbux instrumentations (using babel-register).
 */
export const handler = wrapCommand(async ({ file, ...options }) => {
  processEnv(options.env);

  const babelOptions = buildBabelOptions(options);

  // read code
  const targetPath = resolveCommandTargetPath(file);

  // instrument
  process.stdout.write(`// Instrumenting file ${targetPath}...\n`);
  const inputCode = fs.readFileSync(targetPath, 'utf8');
  const outputCode = transformSync(inputCode, babelOptions).code;

  const prettyCode = prettier.format(outputCode, 
    // see https://stackoverflow.com/questions/50561649/module-build-failed-error-no-parser-and-no-file-path-given-couldnt-infer-a-p
    { parser: "babel" }
  );

  // show in vscode
  // sh.exec(`echo output | code -`);

  process.stdout.write(prettyCode + '\n');
});

