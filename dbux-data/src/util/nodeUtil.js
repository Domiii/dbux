import path from 'path';
import { promises as fs } from 'fs';
import _findPackageJson from 'find-package-json';
import { newFileLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newFileLogger(__filename);

/**
 * This file should contain all code that depends on node.
 * TODO: Allow for this package to become cross-platform and have non-node alternatives.
 * 
 * @file
 */

/**
 * 
 * @param {*} fpath 
 */
export function findPackageJson(fpath) {
  const it = _findPackageJson(fpath);
  const res = it?.next();
  return res?.filename;
}

export async function getPackageJson(fpath) {
  let packagePath;
  try {
    packagePath = findPackageJson(fpath);
    if (!packagePath) {
      return null;
    }

    const content = await fs.readFile(packagePath);
    return JSON.parse(content);
  }
  catch (err) {
    logError('could not open package.json at', packagePath, ' -\n', err);
    return null;
  }
}

export function getFileName(fpath) {
  // return path.parse(fpath).name;
  return path.basename(fpath);
}