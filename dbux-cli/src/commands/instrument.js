// import path from 'path';

import fs from 'fs';
import prettier from 'prettier';
import isString from 'lodash/isString';
import { transformSync } from '@babel/core';

import { wrapCommand } from '../util/commandUtil';
import { processEnv } from '../util/processEnv';

// pre-import dependencies that are not going to be in the target script
import buildBabelOptions from '../buildBabelOptions';
import { buildCommonCommandOptions, resolveCommandTargetPath, processRemainingOptions } from '../commandCommons';

export const command = 'instrument <file> [<outputFile>]';
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
export const handler = wrapCommand(async ({ file, outputFile, ...options }) => {
  // resolve file path
  file = resolveCommandTargetPath(file);

  // options
  processEnv(options.env);

  // inject file name
  let {
    dbuxOptions: babelPluginOptions
  } = options;
  if (!babelPluginOptions || isString(babelPluginOptions)) {
    babelPluginOptions = babelPluginOptions && JSON.parse(babelPluginOptions) || {};
  }
  babelPluginOptions.filenameOverride = options.filenameOverride || file;
  options.dbuxOptions = babelPluginOptions;

  const babelOptions = buildBabelOptions(options);
  processRemainingOptions(options);

  // instrument
  process.stdout.write(`// Instrumenting file ${file} ...\n`);
  const inputCode = fs.readFileSync(file, 'utf8');
  const outputCode = transformSync(inputCode, babelOptions).code;

  let finalCode;
  try {
    finalCode = prettier.format(outputCode,
      // see https://stackoverflow.com/questions/50561649/module-build-failed-error-no-parser-and-no-file-path-given-couldnt-infer-a-p
      { parser: "babel" }
    ) + '\n';
  }
  catch (err) {
    console.error(`prettier failed:\n################################################`,
      err,
      '\n################################################\n\n');
    finalCode = outputCode;
  }

  // show in vscode
  // sh.exec(`echo output | code -`);

  if (!outputFile) {
    process.stdout.write(finalCode);
  }
  else {
    fs.writeFileSync(outputFile, finalCode);
    console.debug(`Wrote outputFile: ${outputFile}`);
  }
});

