/**
 * future-work: support pnp
 */

import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { pathNormalized } from './pathUtil';

const singlePackageRegex = /(?<=node_modules[/])(?!.*\/node_modules\/)(?<packageName>[^/]+)([/](?<name2>[^/]+)?)/;
const multiPackageRegex = /(?<=node_modules[/])(?<packageName>[^/]+)([/](?<name2>[^/]+)?)/g;
const packageFolderRegex = /(?<path>(?<=node_modules[/])(?!.*\/node_modules\/))(?<packageName>[^/]+)([/](?<name2>[^/]+)?)/;

function makePackageRegex(multi) {
  return multi ?
    multiPackageRegex :
    singlePackageRegex;
}

function parseResult(matchResult) {
  let { path, packageName, name2 } = matchResult?.groups || EmptyObject;
  if (!packageName) {
    return null;
  }
  // console.log('result:', JSON.stringify({ packageName, name2 }));
  if (packageName.startsWith('@') && name2) {
    // packageName is actually namespace
    packageName += '/' + name2;
    // console.warn('module match:', packageName, name2);
  }
  return `${path}/${packageName}` || null;
}

/**
 * @example
 * if !multi:
 * `/pre/node_modules/a` -> `a`
 * `/pre/node_modules/a/b` -> `a`
 * `/pre/node_modules/a/b/node_modules/c/d` -> `c`
 * `/pre/node_modules/@a/b` -> `@a/b`
 * 
 * if multi:
 * `/pre/node_modules/a/a2/a3/a4/node_modules/@b/c` -> `['a', '@b/c']`
 * `/pre/node_modules/@a/a2/a3/a4/node_modules/@b/c` -> `['@a/a2', '@b/c']`
 * etc.
 */
export function parsePackageName(fpath, multi = false) {
  fpath = pathNormalized(fpath);

  if (multi) {
    let matchResults = Array.from(fpath.matchAll(multiPackageRegex));
    return matchResults.map(res => parseResult(res));
  }
  else {
    let matchResult = fpath.match(singlePackageRegex);
    return parseResult(matchResult);
  }
}

export function getPackageFolder(fpath) {
  fpath = pathNormalized(fpath);
  let matchResult = fpath.match(packageFolderRegex);
  return parseResult(matchResult);
}


/*

// some testing

var re = /(?<=node_modules[/])(?<packageName>[^/]+)([/](?<name2>[^/]+)?)/g;

function parseResult(matchResult) {
  let { packageName, name2 } = matchResult?.groups || EmptyObject;
  if (!packageName) {
    return null;
  }
  console.log('result:', JSON.stringify({ packageName, name2 }));
  if (packageName.startsWith('@') && name2) {
    // packageName is actually namespace
    packageName += '/' + name2;
    // console.warn('module match:', packageName, name2);
  }
  return packageName || null;
}

function goTest(fpath) {
  let matchResults = Array.from(fpath.matchAll(re));
  console.log(matchResults.map(res => parseResult(res)));
}

[
  '/pre/node_modules/a/b/node_modules/c/d',
  '/pre/node_modules/a/a2/a3/a4/node_modules/@b/c',
  '/pre/node_modules/@a/a2/a3/a4/node_modules/b/c',
  '/pre/node_modules/@a/a2/a3/a4/node_modules/@b/c'
].map(goTest);

*/