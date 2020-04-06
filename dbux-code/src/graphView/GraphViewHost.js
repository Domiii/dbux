import { newLogger } from 'dbux-common/src/log/logger';
import { startGraphHost } from 'dbux-graph-host/src/index';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';

import path from 'path';
import { getWebviewClientHtml } from './clientSource';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');


const defaultColumn = ViewColumn.Two;


export default class GraphViewHost {
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
      // set HTML content
      // TODO: use remote URL when developing locally to enable hot reload
      const scriptPath = path.join(this.resourcePath, 'dist', 'graph.js');
      this.panel.webview.html = await getWebviewClientHtml(scriptPath);

      this._startHost();
    }
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
          // dispose previous message handler; only use one at a time
          this._messageHandler.dispose();
        }
        this._messageHandler = webview.onDidReceiveMessage(
          async (...args) => {
            try {
              await cb(...args);
            }
            catch (err) {
              logError(err);
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

  _startHost() {
    const ipcAdapter = this._buildHostIpcAdapterVsCode(this.panel.webview);
    startGraphHost(ipcAdapter, this._started);
  }

  /**
   * NOTE: this callback might be called more than once.
   */
  _started = (manager) => {
    // (re-)started!
    this.hostComponentManager = manager;
  }
}