import path from 'path';
import { globRelative } from './fileUtil';

export function serializeEnv(o) {
  return Object.entries(o)
    // .map(([key, value]) => `--env ${key}='${JSON.stringify(JSON.stringify(value))}'`)
    .map(([key, value]) => `--env ${key}=${JSON.stringify(JSON.stringify(value))}`)
    .join(' ');
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

export function serializeGlobToEntry(folder, inputFilesGlob) {
  return serializeWebpackInput(globToEntry(folder, inputFilesGlob));
}

export function getWebpackDevServerJs() {
  // return getDbuxPath('webpack-dev-server/bin/webpack-dev-server.js');
  return 'node_modules/webpack-dev-server/bin/webpack-dev-server.js';
}