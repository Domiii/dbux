import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import SocketClient from '../net/SocketClient';
import SocketServer from '../net/SocketServer';
import { sendCommandToDefaultTerminal } from '../codeUtil/terminalUtil';

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

  constructor(port) { 
    this.port = port;

    this._disposable = window.onDidCloseTerminal(terminal => {
      if (terminal === this._terminal) {
        this.dispose();
      }
    });
  }

  getOrCreateTerminalSocketServer() {
    if (!this.socketServer) {
      this.socketServer = new TerminalSocketServer();
      this.socketServer.start(this.port);
    }
    return this.socketServer;
  }

  async handleNewClient(cb) {
    // see: https://socket.io/docs/server-api/
    let socketServer = this.getOrCreateTerminalSocketServer();

    socketServer.onNewClient(async () => {
      const client = await socketServer.waitForNextClient();
      Verbose && debug('client connected');

      const results = await client.waitForResults();
      Verbose && debug('client finished. Results:', results);
      
      cb(results);
    });
  }

  run(cwd, command) {
    this.getOrCreateTerminalSocketServer();

    const args = Buffer.from(JSON.stringify({ port: this.port, cwd, command })).toString('base64');
    const runJsCommand = `node _dbux_run.js ${args}`;
    this._terminal = sendCommandToDefaultTerminal(cwd, runJsCommand);
  }

  dispose() {
    const {
      client,
      _disposable
    } = this;

    this.client = null;
    this._disposable = null;
    this.terminal = null;

    client?.dispose();
    _disposable?.dispose();
  }

  cancel() {
    this.dispose();
  }
}

export function initTerminalWrapper() {
  const port = 6543;

  const wrapper = new TerminalWrapper(port);

  return wrapper;
}