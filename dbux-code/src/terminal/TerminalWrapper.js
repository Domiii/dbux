import fs from 'fs';
import os from 'os';
import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { execCommand } from '../codeUtil/terminalUtil';
import { getResourcePath } from '../resources';

const Verbose = true;
// const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalWrapper');

// ###########################################################################
// execInTerminal w/ process wrapper
// ###########################################################################

export default class TerminalWrapper {
  _disposable;

  start(cwd, command, args) {
    this._disposable = window.onDidCloseTerminal(terminal => {
      if (terminal === this._terminal) {
        this.dispose();
      }
    });
    this._promise = this._run(cwd, command, args);
  }

  async waitForResult() {
    return this._promise;
  }

  async _run(cwd, command, args) {
    // NOTE: fix paths on Windows
    let tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dbux-')).replace(/\\/g, '/');    
    const pathToDbuxRun = getResourcePath('_dbux_run.js').replace(/\\/g, '/');

    // serialize everything
    const runJsargs = { cwd, command, args, tmpFolder };
    const serializedRunJsArgs = Buffer.from(JSON.stringify(runJsargs)).toString('base64');
    const runJsCommand = `node ${pathToDbuxRun} ${serializedRunJsArgs}`;

    debug('wrapping terminal command: ', JSON.stringify(runJsargs), `pathToDbuxRun: ${pathToDbuxRun}`);

    // execute command
    this._terminal = await execCommand('', runJsCommand);

    try {
      const result = await new Promise((resolve, reject) => {
        const watcher = fs.watch(tmpFolder);
        watcher.on('change', (eventType, filename) => {
          watcher.close();

          let result;
          if (filename === 'error') {
            result = { error: fs.readFileSync(path.join(tmpFolder, filename), { encoding: 'utf8' }) };
          } else {
            result = { code: parseInt(filename, 10) };
          }

          Verbose && debug('Client finished. Result:', result);
          fs.unlinkSync(path.join(tmpFolder, filename));
          resolve(result);
        });

        watcher.on('error', (err) => {
          reject(new Error(`FSWatcher error: ${err.message}`));
        });

        window.onDidCloseTerminal((terminal) => {
          if (terminal === this._terminal) {
            watcher.close();
            reject(new Error('The terminal was closed.'));
          }
        });
      });

      return result;
    } finally {
      this.dispose();
      fs.rmdirSync(tmpFolder);
    }
  }

  dispose() {
    const {
      _disposable
    } = this;

    this._disposable = null;
    this._promise = null;
    this.terminal = null;

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
   * @param {object} args 
   */
  static execInTerminal(cwd, command, args) {
    // TODO: register wrapper with context
  
    const wrapper = new TerminalWrapper();
    wrapper.start(cwd, command, args);
    return wrapper;
  }
}