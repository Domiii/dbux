import path from 'path';
import isEmpty from 'lodash/isEmpty';
import glob from 'glob';
import { globRelative } from './fileUtil';
import { pathRelative, pathResolve } from './pathUtil';

/**
 * @see https://github.com/xxorax/node-shell-escape
 */
// import shellescape from 'shell-escape';

function esc(s) {
  // return shellescape([s]);
  return s;
}

export function serializeEnv(o) {
  const res = Object.entries(o)
    // .map(([key, value]) => `--env ${key}='${JSON.stringify(JSON.stringify(value))}'`)
    // .map(([key, value]) => `--env ${key}=${JSON.stringify(JSON.stringify(value))}`)
    .map(([key, value]) => `--env ${esc(key)}=${Buffer.from(JSON.stringify(value)).toString('base64')}`)
    .join(' ');

  return res;
}

export function serializeWebpackInput(o) {
  return JSON.stringify(JSON.stringify(o));
}

export function serializeFilesToEntry(files) {
  return serializeWebpackInput(
    filesToEntry(files)
  );
}

/**
 * @see https://stackoverflow.com/a/4250408
 */
export function fileWithoutExt(fpath) {
  return fpath.replace(/\.[^/.]+$/, "");
}

export function filesToEntry(files, inputPrefix = '') {
  return Object.fromEntries(
    files
      .map(fpath => [
        fileWithoutExt(fpath),
        path.join(inputPrefix, fpath)
      ])
  );
}

export function globToEntry(folder, pattern) {
  return filesToEntry(
    globRelative(folder, pattern)
  );
}

export function globPatternToEntry(contextRoot, entryPatterns, customizer = null) {
  entryPatterns = Array.isArray(entryPatterns) ? entryPatterns : [entryPatterns];
  const entry = Object.fromEntries(
    entryPatterns.flatMap(pattern => {
      let parent;
      if (Array.isArray(pattern)) {
        [parent, pattern] = pattern;
      }
      else {
        parent = '';
        // const startIdx = pattern.indexOf('*');
        // if (startIdx < 0) {
        //   throw new Error(`"${bug.id}" - invalid entryPattern is missing wildcard (*)`);
        // }
        // const parentIdx = pattern.lastIndexOf('/', startIdx);
        // if (parentIdx < 0) {
        //   pattern = ['', pattern];
        // }
        // else {
        //   // split by the last path-separator before the first wildcard
        //   pattern = [pattern.substring(0, parentIdx), pattern.substring(parentIdx + 1)];
        // }
      }
      const entryRoot = pathResolve(contextRoot, parent);
      return glob
        .sync(pathResolve(entryRoot, pattern))
        .map((fpath) => {
          const entryKey = fileWithoutExt(pathRelative(contextRoot, fpath));
          const result = customizer ? customizer(entryKey, fpath, parent, entryRoot) : [entryKey, fpath];
          return result;
        })
        .filter(Boolean);
    })
  );
  if (isEmpty(entry)) {
    throw new Error(`globPatternToEntry failed - pattern did not match any files (contextRoot="${contextRoot}"):\n    ${JSON.stringify(entryPatterns)}`);
  }
  return entry;
}

export function serializeGlobToEntry(folder, inputFilesGlob) {
  return serializeWebpackInput(globToEntry(folder, inputFilesGlob));
}

export function getWebpackDevServerJs() {
  // return getDbuxPath('webpack-dev-server/bin/webpack-dev-server.js');
  return 'webpack-dev-server/bin/webpack-dev-server.js';
}

export function getWebpackJs() {
  return 'webpack/bin/webpack.js';
}