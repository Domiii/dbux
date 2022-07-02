import fs from 'fs';
import os from 'os';
import path from 'path';
import { window, workspace } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathNormalized, pathNormalizedForce, whichNormalized } from '@dbux/common-node/src/util/pathUtil';
// import sleep from '@dbux/common/src/util/sleep';
import { closeDefaultTerminal, runInTerminal, runInTerminalInteractive } from '../codeUtil/terminalUtil';
import { getShellPath, getNodePath, getResourcePath } from '../codeUtil/codePath';
import NestedError from '@dbux/common/src/NestedError';

// const Verbose = true;
const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalWrapper');


// ###########################################################################
// TerminalWrapper
// ###########################################################################

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
    cwd = pathNormalizedForce(cwd);
    let tmpFolder = pathNormalized(fs.mkdtempSync(path.join(os.tmpdir(), 'dbux-')));
    tmpFolder = pathNormalizedForce(tmpFolder);

    const pathToNode = getNodePath();
    const shell = getShellPath();
    const pathToDbuxRun = pathNormalizedForce(getResourcePath('src/_dbux_run.js'));

    // serialize all arguments for dbux_run.js
    const runJsargs = { 
      cwd, 
      command, 
      options,
      tmpFolder,
      shell
    };
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
      let newErr = new NestedError(`[FSWatcher error while waiting for TerminalWrapper]`, err);
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
      try {
        fs.rmdirSync(tmpFolder, { force: true, recursive: true });
      }
      catch (err) {
        debug(`(unable to remove temp folder "${tmpFolder}" - ${err.message})`);
      }
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