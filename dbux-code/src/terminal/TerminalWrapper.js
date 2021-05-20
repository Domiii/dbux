import fs from 'fs';
import os from 'os';
import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from '@dbux/projects/src/util/Process';
import which from '@dbux/projects/src/util/which';
// import sleep from '@dbux/common/src/util/sleep';
import { closeDefaultTerminal, runInTerminal, runInTerminalInteractive } from '../codeUtil/terminalUtil';
import { getResourcePath } from '../resources';

// const Verbose = true;
const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalWrapper');

// ###########################################################################
// utilities
// ###########################################################################

/**
 * TODO: clean this up and move it to a more suitable place
 */
async function getPathToNode() {
  const hasVolta = !!which('volta');
  if (hasVolta) {
    // get the actual Node binary location that is not inside the target directory (i.e. the globally installed version)
    return Process.execCaptureOut(`volta which node`, { processOptions: { cwd: __dirname } });
  }
  return 'node';
}

// ###########################################################################
// TerminalWrapper
// ###########################################################################

function fixPathForSerialization(p) {
  // fix backslashes (Process, Terminal, babelInclude)
  return p.replace(/\\/g, '\\\\');
}

export default class TerminalWrapper {
  _disposable;

  start(cwd, command, options) {
    // this._disposable = window.onDidCloseTerminal(terminal => {
    //   if (terminal === this._terminal) {
    //     this.dispose();
    //   }
    // });
    if (Array.isArray(command)) {
      this._promise = this._runAll(cwd, command, options);
    }
    else {
      this._promise = this._run(cwd, command, options);
    }
  }

  async waitForResult() {
    return this._promise;
  }

  async _runAll(cwd, cmds, options) {
    const res = [];
    closeDefaultTerminal();
    for (const command of cmds) {
      res.push(await this._run(cwd, command, options, true));
    }
    return res;
  }

  async _run(cwd, command, options, isInteractive = false) {
    // NOTE: fix paths on Windows
    let tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dbux-'));
    const pathToNode = fixPathForSerialization(await getPathToNode());
    const pathToDbuxRun = fixPathForSerialization(getResourcePath('../dist/_dbux_run.js'));

    // command = fixPathForSerialization(command); // not necessary (due to base64 serialization)

    // serialize everything
    const runJsargs = { cwd, command, options, tmpFolder };
    const serializedRunJsArgs = Buffer.from(JSON.stringify(runJsargs)).toString('base64');
    // const runJsCommand = `pwd && node -v && which node && echo %PATH% && node ${pathToDbuxRun} ${serializedRunJsArgs}`;
    const runJsCommand = `"${pathToNode}" "${pathToDbuxRun}" ${!!isInteractive + 0} ${serializedRunJsArgs}`;

    debug('wrapping terminal command: ', JSON.stringify(runJsargs), `pathToDbuxRun: ${pathToDbuxRun}`);

    // execute command

    const commandCall = `${cwd}$ ${command}`;

    let _resolve, _reject, _promise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    let resolved = false;
    const watcher = fs.watch(tmpFolder);
    watcher.on('change', (eventType, filename) => {
      watcher.close();
      this.dispose();

      let result;
      if (filename === 'error') {
        let errorString = fs.readFileSync(path.join(tmpFolder, filename), { encoding: 'utf8' });
        let error = JSON.parse(errorString);
        _reject(new Error(`Terminal wrapper received error: ${error?.stack || JSON.stringify(error)}`));
      } else {
        result = { code: parseInt(filename, 10) };
        Verbose && debug('Terminal command finished. Result:', JSON.stringify(result));
        _resolve(result);
        resolved = true;
      }

      fs.unlinkSync(path.join(tmpFolder, filename));
    });

    watcher.on('error', (err) => {
      let newErr = new Error(`FSWatcher error: ${err.message}`);
      if (resolved) {
        warn(newErr);
      }
      else {
        _reject(newErr);
      }
    });

    window.onDidCloseTerminal((terminal) => {
      if (terminal === this._terminal) {
        watcher.close();
        this.dispose();

        const msg = `Terminal closed (${commandCall})`;
        if (resolved) {
          debug(msg);
        }
        else {
          let newErr = new Error(msg);
          _reject(newErr);
        }
      }
    });

    try {
      // Go!
      const execFn = isInteractive ? runInTerminalInteractive : runInTerminal;
      this._terminal = await execFn(cwd, runJsCommand);

      return await _promise;
    }
    catch (err) {
      // await sleep(5);
      // this.dispose();
      err.message = `Terminal command failed: ${err.message}\n\n  command $ ${commandCall}`;
      throw err;
    } finally {
      // this.dispose();
      fs.rmdirSync(tmpFolder);
    }
  }

  dispose() {
    const {
      _disposable
    } = this;

    this._disposable = null;
    this._promise = null;
    this._terminal = null;

    _disposable?.dispose();
  }

  cancel() {
    this.dispose();
  }


  // ###########################################################################
  // static functions
  // ###########################################################################

  /**
   * Execute `command` in `cwd` in terminal.
   * @param {string} cwd Set working directory to run `command`.
   * @param {string} command The command will be executed.
   * @param {object} options 
   */
  static execInTerminal(cwd, command, options) {
    // TODO: register wrapper with context

    const wrapper = new TerminalWrapper();
    wrapper.start(cwd, command, options);
    return wrapper;
  }
}