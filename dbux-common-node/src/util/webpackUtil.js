import path from 'path';
/**
 * @see https://github.com/xxorax/node-shell-escape
 */
// import shellescape from 'shell-escape';
import { globRelative } from './fileUtil';

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