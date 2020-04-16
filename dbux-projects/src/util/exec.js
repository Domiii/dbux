import path from 'path';
import isString from 'lodash/isString';
import sh from 'shelljs';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import spawn from 'child_process';

function cleanOutput(chunk) {
  return isString(chunk) && chunk.trim() || chunk;
}

function pipeStreamToLogger(stream, logger) {
  // TODO: concat chunks, and wait for, then split by newline instead (or use `process.stdout/stderr.write`)
  stream.on('data', (chunk) => {
    logger.debug('', cleanOutput(chunk));
  });
}

/**
 * Wrapper for `shelljs.exec`.
 * 
 * 1. Promisifies `shelljs.exec` with { async: true }.
 * 2. Handles error code 127 by default
 * 3. more sugar
 */
export default async function exec(command, logger, options, ignoreNotFound = false) {
  options = {
    cwd: sh.pwd().toString(),
    ...(options || EmptyObject),
    async: true
  };

  // some weird problem where some shells don't recognize things correctly
  // see: https://github.com/shelljs/shelljs/blob/master/src/exec.js#L51
  options.cwd = path.resolve(options.cwd);

  logger.debug('>', command); //, `(pwd = ${sh.pwd().toString()})`);

  return new Promise((resolve, reject) => {
    const child = spawn.exec(command, options);

    pipeStreamToLogger(child.stdout, logger);
    pipeStreamToLogger(child.stderr, logger);

    // done
    let done = false;
    child.on('exit', (code, signal) => {
      if (done) { return; }
      done = true;
      if (code) {
        reject(code);
      }
      else {
        resolve();
      }
    });
    child.on('error', (err) => {
      if (done) { return; }
      done = true;
      
      const code = err.code = err.code || -1;

      if (ignoreNotFound && code === 127) {
        // command not found, but we don't care
        // see: https://stackoverflow.com/questions/1763156/127-return-code-from
        resolve();
      }
      else {
        // throw new Error(`"${command}" failed because executable or command not found. Either configure it's absolute path or make sure that it is installed and in your PATH.`);
        reject(new Error(`[${err.code}] ${err.message}`));
      }
    });
  });
}