import fs from 'fs';
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { getDbuxTargetPath } from '@dbux/common/src/dbuxPaths';
import SocketClient from '../net/SocketClient';
import SocketServer from '../net/SocketServer';
import { execCommand } from '../codeUtil/terminalUtil';

// const Verbose = true;
const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('terminalWrapper');

// ###########################################################################
// execInTerminal w/ process wrapper
// ###########################################################################

class TerminalClient extends SocketClient {
  constructor(...args) {
    super(...args);

    this._resultPromise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    this.on('error', (err) => {
      logError(err);
    });
    
    this.on('results', (results) => {
      Verbose && debug('results received');
      this.resolve(results);
    });
  }

  resolve(results) {
    const resolve = this._resolve;
    this._reject = null;
    this._resolve = null;
    resolve?.(results);
  }

  _handleDisconnect() {
    const reject = this._reject;
    this._reject = null;
    this._resolve = null;
    reject?.(undefined);
  }

  async waitForResults() {
    return this._resultPromise;
  }
}

class TerminalSocketServer extends SocketServer {
  constructor() {
    super(TerminalClient);
  }

  /**
   * @return {Promise<TerminalClient>}
   */
  async waitForNextClient() {
    if (!this._promise) {
      this._promise = new Promise(resolve => {
        this._resolve = resolve;
      });
    }
    return this._promise;
  }

  _handleAccept(socket) {
    const client = super._handleAccept(socket);
    if (this._resolve) {
      const resolve = this._resolve;
      this._resolve = this._promise = null;
      resolve(client);
    }
    return client;
  }
}

export default class TerminalWrapper {
  _disposable;

  start(cwd, command, port, args) {
    this._disposable = window.onDidCloseTerminal(terminal => {
      if (terminal === this._terminal) {
        this.dispose();
      }
    });
    this._promise = this._run(cwd, command, port, args);
  }

  async waitForResult() {
    return this._promise;
  }

  async _run(cwd, command, port, args) {
    // see: https://socket.io/docs/server-api/
    let socketServer = this.socketServer = new TerminalSocketServer();
    await socketServer.start(port);
    Verbose && debug('started');

    try {
      const runJsArgs = Buffer.from(JSON.stringify({ port, cwd, command, args })).toString('base64');
      const initScript = getDbuxTargetPath('cli', 'lib/link-dependencies.js');
      if (!fs.existsSync(initScript)) {
        throw new Error(`Dbux cli not installed (could not resolve "${initScript}")`);
      }
      
      const runJsCommand = `node --require=${initScript} _dbux_run.js ${runJsArgs}`;
      this._terminal = await execCommand(cwd, runJsCommand);

      const result = await new Promise((resolve, reject) => {
        socketServer.waitForNextClient().then(async (client) => {
          this.client = client;
          Verbose && debug('client connected');

          let results = await client.waitForResults();
          Verbose && debug('client finished. Results:', results);

          resolve(results?.[0] || null);
        });

        window.onDidCloseTerminal((terminal) => {
          if (terminal === this._terminal) {
            reject(new Error('User closed the terminal'));
          }
        });
      });
      return result;
    }
    finally {
      // clean up server
      this.dispose();
    }
  }

  dispose() {
    const {
      socketServer,
      client,
      _disposable
    } = this;

    this.socketServer = null;
    this.client = null;
    this._disposable = null;
    this._promise = null;
    this.terminal = null;

    socketServer?.dispose();
    client?.dispose();
    _disposable?.dispose();
  }

  cancel() {
    this.dispose();
  }


  // ###########################################################################
  // static functions
  // ###########################################################################

  static execInTerminal(cwd, command, args) {
    const port = 6543;
  
    // TODO: register wrapper with context
  
    const wrapper = new TerminalWrapper();
    wrapper.start(cwd, command, port, args);
    return wrapper;
  }
}