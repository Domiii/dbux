import path from 'path';
import isString from 'lodash/isString';
import sh from 'shelljs';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import { newLogger } from 'dbux-common/src/log/logger';
import spawn from 'child_process';

const { log, debug, warn, error: logError } = newLogger('Process');

function cleanOutput(chunk) {
  return isString(chunk) && chunk.trim() || chunk;
}

function pipeStreamToLogger(stream, logger) {
  // TODO: concat chunks, and wait for, then split by newline instead (or use `process.stdout/stderr.write`)
  stream.on('data', (chunk) => {
    logger.debug('', cleanOutput(chunk));
  });
}

export default class Process {
  command;
  _process;
  _promise;

  constructor() {
  }

  captureStream(stream) {
    this.out = '';
    stream.on('data', chunk => {
      this.out += chunk;
    });
  }

  /**
   *
   * @param {*} options.failOnStatusCode If true (default), fail if command returns non-zero status code
   * @param {*} options.failWhenNotFound If true (default), fails if program was not found
   */
  async start(command, logger, options) {
    if (!command || !logger) {
      throw new Error(`command or logger parameter missing: ${command}, ${logger}`);
    }
    if (this._promise) {
      throw new Error('tried to start process more than once');
    }

    this.command = command;

    const processOptions = {
      cwd: sh.pwd().toString(),
      ...(options?.processOptions || EmptyObject),
      async: true
    };

    const {
      failOnStatusCode = true,
      failWhenNotFound = true
    } = (options || EmptyObject);

    // some weird problem where some shells don't recognize things correctly
    // see: https://github.com/shelljs/shelljs/blob/master/src/exec.js#L51
    const { cwd } = processOptions;

    if (!cwd) {
      throw new Error('Unknown cwd. Make sure you either pass it in via `processOptions.cwd` or setting it via `shelljs.cd`.');
    }

    if (!sh.test('-d', cwd)) {
      logger.error(`WARNING: Trying to execute command in non-existing working directory="${cwd}"`);
    }

    processOptions.cwd = path.resolve(cwd);

    logger.debug(`> ${cwd}$`, command); //, `(pwd = ${sh.pwd().toString()})`);

    const process = this._process = spawn.exec(command, processOptions);

    pipeStreamToLogger(process.stdout, logger);
    pipeStreamToLogger(process.stderr, logger);

    if (options?.captureOut) {
      this.captureStream(process.stdout);
    }

    // done
    let done = false;
    function checkDone() {
      if (done) {
        return true;
      }
      done = true;

      // if (this._killed) {
      //   resolve('killed');
      //   return true;
      // }

      return false;
    }

    return this._promise = new Promise((resolve, reject) => {
      process.on('exit', (code, signal) => {
        // logger.debug(`process exit, code=${code}, signal=${signal}`);
        if (checkDone()) { return; }

        if (!failOnStatusCode && code) {
          reject(code);
        }
        else {
          resolve(code);
        }
      });

      process.on('error', (err) => {
        if (checkDone()) { return; }

        const code = err.code = err.code || -1;

        if (failWhenNotFound && code === 127) {
          // command not found, but we don't care
          // see: https://stackoverflow.com/questions/1763156/127-return-code-from
          resolve();
        }
        else {
          // throw new Error(`"${command}" failed because executable or command not found. Either configure it's absolute path or make sure that it is installed and in your PATH.`);
          reject(new Error(`[${err.code}] ${err.message}`));
        }
      });
    }).finally(this._finished);
  }

  _finished = () => {
    this._process = null; // done
  }

  /**
   * NOTE: SIGTERM is the default choice for the internally used `ChildProcess.kill` method as well.
   * @see https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
   */
  async kill(signal = 'SIGTERM') {
    // TODO: does not work correctly on windows
    // see: https://stackoverflow.com/questions/32705857/cant-kill-child-process-on-windows?noredirect=1&lq=1
    this._killed = true;
    this._process?.kill(signal);
    await this.waitToEnd().catch(err => {
      debug('ignored process error after kill:', err.message);
    });
  }

  async waitToEnd() {
    // add noop to make sure callers to `wait` will resolve in order
    if (!this._promise) {
      // not started yet
      return;
    }
    await (this._promise = this._promise.then(() => { }));
  }

  static async execCaptureOut(cmd, options, logger) {
    const process = new Process();

    options = {
      ...options,
      captureOut: true
    };

    await process.start(cmd, logger || newLogger('exec'), options);

    return process.out;
  }
}