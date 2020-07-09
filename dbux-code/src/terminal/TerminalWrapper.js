import { newLogger } from 'dbux-common/src/log/logger';
import SocketClient from '../net/SocketClient';
import SocketServer from '../net/SocketServer';
import { sendCommandToDefaultTerminal } from '../codeUtil/terminalUtil';

const Verbose = true;

const { log, debug, warn, error: logError } = newLogger('terminalWrapper');

// ###########################################################################
// execInTerminal w/ process wrapper
// ###########################################################################

class TerminalClient extends SocketClient {
  constructor(...args) {
    super(...args);

    this._resultPromise = new Promise(resolve => {
      this._resolve = resolve;
    });
    
    this.on('results', (results) => {
      Verbose && debug('results received');
      this._resolve(results);
    });
  }

  resolve(results) {
    this._resolve(results);
  }

  _handleDisconnect() {
    this._resolve(undefined);
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
  start(cwd, command, port) {
    this._promise = this._run(cwd, command, port);
  }

  async waitForResult() {
    return this._promise;
  }

  async _run(cwd, command, port) {
    // see: https://socket.io/docs/server-api/
    let socketServer = this.socketServer = new TerminalSocketServer();
    socketServer.start(port);
    Verbose && debug('started');

    try {
      const args = JSON.stringify(JSON.stringify({ port, cwd, command }));
      const runJsCommand = `node _dbux_run.js ${args}`;
      sendCommandToDefaultTerminal(runJsCommand);

      const client = this.client = await socketServer.waitForNextClient();
      Verbose && debug('client connected');
      socketServer.dispose(); // done with the server
      const results = await client.waitForResults();
      Verbose && debug('client finished. Results:', results);
      return results?.[0] || null;
    }
    finally {
      // clean up server
      this.dispose();
    }
  }

  dispose() {
    this.socketServer?.close();
    this.client?.close();
    this._promise = null;
  }

  cancel() {
    this.dispose();
  }
}

export function execInTerminal(cwd, command) {
  const port = 6543;

  const wrapper = new TerminalWrapper();
  wrapper.start(cwd, command, port);
  return wrapper;
}