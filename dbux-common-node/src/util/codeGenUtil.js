/**
 * @file JavaScript file code generation utilities.
 */

import fs from 'fs';
import glob from 'glob';
import isString from 'lodash/isString';
import path from 'path';

const IndentUnit = '  ';

function prefixJoin(arr, sep) {
  return `${sep}${arr.join(sep)}`;
}

function spaceAfter(s) {
  return s ? `${s} ` : '';
}

function genFunction(name, params, bodyLines, prefix, indent) {
  prefix = spaceAfter(prefix);
  const indentBody = indent + IndentUnit;
  const body = `${prefixJoin(bodyLines, `\n${indentBody}`)}`;
  return `${indent}${prefix}function ${name}(${params}) {${body}\n${indent}}`;
}

// /**
//  * NOTE: proposal is stage 1 only, so we workaround it
//  * @see https://github.com/tc39/proposal-export-default-from#exporting-a-default-as-default
//  */
function genImport(dir, name) {
  return `import ${name} from '${dir}/${name}';`;
}

function genExportAll(names) {
  return `export {\n${IndentUnit}${names.join(`,\n${IndentUnit}`)}\n};`;
}

/**
 * Produce a js file that imports and exports all files in a given directory.
 */
export function writeFileRegistryFile(outFile, dir, predicate, moreImports = '', initFn = null) {
  const files = glob.sync(dir + '/*')
    .filter(f => path.basename(f) !== outFile)
    .map(f => path.parse(f).name)
    .filter(fName => !predicate || predicate(fName));
  moreImports = isString(moreImports) ? [moreImports] : moreImports;
  if (initFn && !initFn.name) {
    throw new Error(`initFn must be named`);
  }
  const doInit = !initFn ? [] : [
    initFn.toString(),
    ...files.map(obj => `${initFn.name}(${obj});`)
  ];

  const entries = [
    // imports
    ...moreImports,
    ...files.map(f => genImport('.', f)),
    '',
    ...doInit,
    '',
    // exports
    genExportAll(files)
  ];

  outFile = path.resolve(dir, outFile);
  fs.writeFileSync(outFile, entries.join('\n'));
}