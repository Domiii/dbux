import path from 'path';
import isString from 'lodash/isString';
import omit from 'lodash/omit';
import kill from 'tree-kill';
import sh from 'shelljs';
import stringArgv from 'string-argv';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { ChildProcess, execSync } from 'child_process';
import spawn from 'cross-spawn';
import { pathNormalizedForce } from '@dbux/common-node/src/util/pathUtil';
import { truncateStringDefault } from '@dbux/common/src/util/stringUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('Process');

let DefaultConfig = { 
  shell: 'bash'
};

function cleanOutput(chunk) {
  if (!isString(chunk)) {
    chunk = chunk.toString('utf8');
  }
  return chunk.trim();
}

function pipeStreamToFn(stream, logFn) {
  // TODO: concat chunks, and wait for, then split by newline instead (or use `process.stdout/stderr.write`)
  stream.on('data', (chunk) => {
    logFn('', cleanOutput(chunk));
  });
}

export function initProcess(cfg) {
  DefaultConfig = cfg;
}

/**
 * These options are passed to child_process as-is (with some minor customizations).
 */
export class RawProcessOptions {
  env;
}

export class ProcessOptions {
  /**
   * If true(default ), fail if command returns non - zero status code.
   * @type {boolean}
   */
  failOnStatusCode;

  /**
   * If true(default ), fails if program was not found.
   * @type {boolean}
   */
  failWhenNotFound;

  /**
   * @type {RawProcessOptions}
   */
  processOptions;

  /**
   * @type {Array.<string>?}
   */
  ignoreEnv;
}

export default class Process {
  command;
  /**
   * @type {ChildProcess}
   */
  _process;
  _promise;

  constructor() {
  }

  captureOutputStream(stream) {
    this.out = '';
    stream.on('data', chunk => {
      this.out += chunk;
    });
  }

  captureErrorStream(stream) {
    this.err = '';
    stream.on('data', chunk => {
      this.err += chunk;
    });
  }

  /**
   *
   * @param {ProcessOptions} options
   */
  async start(command, logger, options, input) {
    if (!command || !logger) {
      throw new Error(`command or logger parameter missing: ${command}, ${logger}`);
    }
    if (this._promise) {
      throw new Error('tried to start process more than once');
    }

    // fix backslashes (Process, Terminal, babelInclude)
    command = command.replace(/\\/g, '\\\\');

    this.command = command;

    const {
      failOnStatusCode = true,
      failWhenNotFound = true,
      sync = false,
      logStdout = true,
      logStderr = true,
      readStdin = false,
      ignoreEnv
    } = (options || EmptyObject);

    const processOptions = {
      cwd: sh.pwd().toString(),
      ...(options?.processOptions || EmptyObject),
      // async: !sync,
      // stdio: sync ? [0, 1, 2] : 'inherit'
      // stdio: 'inherit'
      // stdio: [0, 1, 2]
    };
    processOptions.cwd = pathNormalizedForce(processOptions.cwd);

    // if (!sync) {
    //   // NOTE: shell = true exists only for spawn, not for exec
    //   processOptions.shell = true;
    // }
    processOptions.shell = DefaultConfig.shell;

    if (processOptions.env || ignoreEnv) {
      /**
       * Fix env problems:
       * if `env` is provided, it will override all of the parent env.
       * This approach merges parent and custom env.
       * Also allows for ignoring parent env settings.
       * 
       * @see https://github.com/nodejs/node/issues/12986#issuecomment-301101354
       * @see https://github.com/microsoft/vscode/issues/102890
       */
      processOptions.env = cloneEnv(processOptions.env, ignoreEnv);
    }

    // some weird problem where some shells don't recognize things correctly
    // see: https://github.com/shelljs/shelljs/blob/master/src/exec.js#L51
    let { cwd } = processOptions;

    if (!cwd) {
      throw new Error('Unknown cwd. Make sure you either pass it in via `processOptions.cwd` or setting it via `shelljs.cd`.');
    }

    cwd = processOptions.cwd = path.resolve(cwd);

    if (!sh.test('-d', cwd)) {
      logger.error(`WARNING: Trying to execute command in non-existing working directory="${cwd}"`);
    }

    // spawn regular process
    const [commandName, ...commandArgs] = stringArgv(command);
    this.commandName = commandName;

    let processExecLabel = `${path.basename(cwd)}$ "${commandName}" ${commandArgs.map(s => `${s}`).join(' ')}`;
    processExecLabel = truncateStringDefault(processExecLabel);
    logger.debug('>', processExecLabel); //, `(pwd = ${sh.pwd().toString()})`);

    if (sync) {
      // TODO: sync might not work, since it foregoes cross-spawn
      // NOTE: this will just block until the process is done
      const result = execSync(command, processOptions);
      return result;
    }

    this._process = spawn(commandName, commandArgs, processOptions);
    const newProcess = this._process;

    if (logStdout) {
      pipeStreamToFn(newProcess.stdout, logger.debug);
    }
    if (logStderr) {
      pipeStreamToFn(newProcess.stderr, logger.warn);
    }
    // newProcess.stdin.on('data', buf => {
    //   console.error('newProcess stdin data', buf.toString());
    // });


    if (options?.captureOut) {
      this.captureOutputStream(newProcess.stdout);
    }

    if (options?.captureErr) {
      this.captureErrorStream(newProcess.stderr);
    }

    // ########################################
    // handle stdin
    // ########################################

    let onStdin;
    if (input) {
      newProcess.stdin.write(`${input}\n`);
      newProcess.stdin.end();
    }
    else if (readStdin) {
      // WARNING: On MAC, for some reason, piping seems to swallow up line feeds?
      // TODO: only register stdin listener on `resume`?
      newProcess.stdin.on('resume', (...args) => {
        logTrace('STDIN RESUME', ...args);
      });
      onStdin = buf => {
        const s = buf.toString();
        // console.error('stdin data', s);

        let lines = s.split(/\r\n/g);
        const lastLine = lines[lines.length - 1];
        if (lines.length > 1) {
          lines = lines.slice(0, lines.length - 1);
          lines.forEach(l => newProcess.stdin.write(l + '\n'));
        }
        newProcess.stdin.write(lastLine);
        if (s.endsWith('\n') || s.endsWith('\r')) {
          newProcess.stdin.write('\n');
        }
      };
      process.stdin.on('data', onStdin);
      // setTimeout(() => {
      //   newProcess.stdin.end();
      // }, 1000);
      // process.stdin.pipe(newProcess.stdin);
    }


    // ########################################
    // exit handling + promise wrapper
    // ########################################

    // done
    let done = false;
    function checkDone() {
      // console.warn('PROCESS checkDone()', done + 1);
      if (done) {
        return true;
      }
      done = true;

      // stop reading stdin
      onStdin && process.stdin.off('data', onStdin);
      newProcess.stdin.destroy();

      setTimeout(() => {
        // make sure, the process never lingers excessively
        if (newProcess.connected) {
          logger.warn(`process was killed due to lingering.`);
          newProcess.kill();
        }
      }, 300);

      // if (this._killed) {
      //   resolve('killed');
      //   return true;
      // }

      return false;
    }

    return this._promise = new Promise((resolve, reject) => {
      newProcess.on('exit', (code, signal) => {
        const isDone = checkDone(); // WARNING: only call `checkDone` once!!
        logger.debug(`  ("${commandName}" EXIT${isDone && ' (ignored)' || ''}: code=${code}, signal=${signal})`);
        if (isDone) { return; }
        this.code = code;

        let more;
        if (this.err) {
          more = ` - ${this.err}`;
        }

        if (this._dieSilent) {
          resolve();
        }
        else if (this._killed) {
          reject(new Error(`Process "${processExecLabel}" was killed${more}`));
        }
        else if (failOnStatusCode && code) {
          reject(new Error(`Process "${processExecLabel}" failed with status code: ${code}${more}`));
        }
        else {
          resolve(code);
        }
      });

      newProcess.on('error', (err) => {
        const isDone = checkDone(); // WARNING: only call `checkDone` once!!
        logger.debug(`  "${commandName}" ERROR${isDone && ' (ignored)' || ''}: code=${err.code}, msg=${err.message}`);
        if (isDone) { return; }

        const code = err.code = err.code || -1;
        this.code = code;

        if (!failWhenNotFound && (code === 127 || code === 'ENOENT')) {
          // command not found, but we don't care
          // see: https://stackoverflow.com/questions/1763156/127-return-code-from
          resolve(code);
        }
        else {
          // throw new Error(`"${command}" failed because executable or command not found. Either configure it's absolute path or make sure that it is installed and in your PATH.`);
          reject(new Error(`Process "${processExecLabel}" failed with error "${err.code}": ${err.message}`));
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
  async kill(signal = 'SIGINT', silent = false) {
    // TODO: does not work correctly on windows
    // see: https://stackoverflow.com/questions/32705857/cant-kill-child-process-on-windows?noredirect=1&lq=1
    this._killed = true;
    this._process.stdin?.pause(); // see https://stackoverflow.com/questions/18694684/spawn-and-kill-a-process-in-node-js
    this._dieSilent = silent;
    // this._process?.kill(signal);
    kill(this._process.pid, signal);
    await this.waitToEnd().
      then((code) => {
        debug(`process killed (code=${code}): command='${this.command}'`);
      }).
      catch(err => {
        debug('ignored process error after kill:', err.message);
      });
  }

  async killSilent(signal = 'SIGINT') {
    return await this.kill(signal, true);
  }

  async waitToEnd() {
    // add noop to make sure callers to `wait` will resolve in order
    if (!this._promise) {
      // not started yet
      return;
    }
    await (this._promise = this._promise.then(() => { }));
  }

  static async execCaptureOut(cmd, options, logger, input) {
    const newProcess = new Process();

    options = {
      captureOut: true,
      logStdout: false,
      ...options
    };

    await newProcess.start(cmd, logger || newLogger('exec'), options, input);

    return (newProcess.out || '').trim();
  }

  static async execCaptureErr(cmd, options, logger, input) {
    const newProcess = new Process();

    options = {
      captureErr: true,
      logStderr: false,
      ...options
    };

    await newProcess.start(cmd, logger || newLogger('exec'), options, input);

    return (newProcess.err || '').trim();
  }

  static async execCaptureAll(cmd, options, logger, input) {
    const newProcess = new Process();

    options = {
      captureOut: true,
      captureErr: true,
      logStdout: false,
      logStderr: false,
      ...options
    };

    let code = await newProcess.start(cmd, logger || newLogger('exec'), options, input);

    return {
      code,
      out: (newProcess.out || '').trim(),
      err: (newProcess.err || '').trim(),
    };
  }

  static async exec(command, options, logger) {
    const newProcess = new Process();
    return newProcess.start(command, logger || newLogger('exec'), options);
  }
}

export function cloneEnv(customEnv, envIgnore) {
  let { env } = process;
  env = omit(env, envIgnore);
  return { ...env, ...customEnv };
}