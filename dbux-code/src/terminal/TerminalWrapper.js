import fs from 'fs';
import os from 'os';
import path from 'path';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { execCommand } from '../codeUtil/terminalUtil';

// const Verbose = true;
const Verbose = false;

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
    let tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dbux-'));
    command = `${command}; touch ${tmpFolder}/$?`;

    this._terminal = await execCommand(cwd, command, args);

    try {
      const result = await new Promise((resolve, reject) => {
        const watcher = fs.watch(tmpFolder);
        watcher.on('change', (eventType, filename) => {
          if (eventType !== 'change') return;
          watcher.close();

          fs.unlinkSync(path.join(tmpFolder, filename));
          resolve({ code: parseInt(filename, 10) });
        });

        window.onDidCloseTerminal((terminal) => {
          if (terminal === this._terminal) {
            reject(new Error('User closed the terminal'));
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
   * @param {object} args Not working things (currently).
   */
  static execInTerminal(cwd, command, args) {
    // TODO: register wrapper with context
  
    const wrapper = new TerminalWrapper();
    wrapper.start(cwd, command, args);
    return wrapper;
  }
}