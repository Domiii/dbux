import { newLogger } from 'dbux-common/src/log/logger';
import { startGraphHost } from 'dbux-graph-host/src/index';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';
import path from 'path';
import { getWebviewClientHtml } from './clientSource';

const { log, debug, warn, error: logError } = newLogger('GraphViewHost');


const defaultColumn = ViewColumn.Two;

export default class GraphWebView {
  extensionContext;

  panel;
  hostComponentManager;
  resourcePath;

  constructor(extensionContext) {
    this.extensionContext = extensionContext;
  }

  /**
   * @see https://code.visualstudio.com/api/extension-guides/webview
   */
  async show() {
    this.resourcePath = path.join(this.extensionContext.extensionPath, 'resources');

    // reveal or create
    if (!this.reveal()) {
      this._createWebview();
      await this.restart();
    }
  }

  restart = async () => {
    // set HTML content + restart
    // TODO: use remote URL when developing locally to enable hot reload
    this._restartHost();
    await this._restartClientDOM();
  }

  reveal() {
    if (this.panel) {
      // reveal
      this.panel.reveal(defaultColumn);
      return true;
    }
    return false;
  }

  // ###########################################################################
  // initialization
  // ###########################################################################

  _messageHandler;

  _buildHostIpcAdapterVsCode(webview) {
    return {
      postMessage(msg) {
        webview.postMessage(msg);
      },

      onMessage: ((cb) => {
        if (this._messageHandler) {
          // WARNING: only allow one message handler at a time
          // dispose previous message handler
          this._messageHandler.dispose();
        }
        this._messageHandler = webview.onDidReceiveMessage(
          async (...args) => {
            try {
              await cb(...args);
            }
            catch (err) {
              logError('Error processing message from Client', err);
            }
          },
          null,
          this.extensionContext.subscriptions
        );
      }).bind(this)
    };
  }

  _createWebview() {
    const webviewId = 'dbux-graph';
    const title = 'Graph View';

    this.panel = window.createWebviewPanel(
      webviewId,
      title,
      defaultColumn, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(this.resourcePath)]
      }
    );

    // cleanup
    this.panel.onDidDispose(
      () => {
        // do further cleanup operations
        this.panel = null;
      },
      null,
      this.extensionContext.subscriptions
    );
  }

  /**
   * hackfix: necessary because webview won't update if the `html` value is not different from previous assignment.
   */
  _webviewUpdateToken = 0;

  async _restartClientDOM() {
    const scriptPath = path.join(this.resourcePath, 'dist', 'graph.js');
    this.panel.webview.html = (await getWebviewClientHtml(scriptPath)) + `<!-- ${++this._webviewUpdateToken} -->`;
  }

  _restartHost() {
    const ipcAdapter = this._buildHostIpcAdapterVsCode(this.panel.webview);
    startGraphHost(this._started, ipcAdapter, this.externals);
  }

  /**
   * NOTE: this callback might be called more than once.
   */
  _started = (manager) => {
    // (re-)started!
    this.hostComponentManager = manager;
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    restart: this.restart,

    logClientError(args) {
      logError('[CLIENT ERORR]', ...args);
    },

    async confirm(message) {
      const cfg = { modal: true };
      const result = await window.showInformationMessage(message, cfg, 'Ok', 'Cancel');
      return result === 'Ok';
    },

    async prompt(message) {
      const result = await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: message
      });
      return result;
    }
  }
}