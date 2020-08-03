import { newLogger } from '@dbux/common/src/log/logger';
import { startGraphHost } from '@dbux/graph-host/src/index';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';
import path from 'path';
import { buildWebviewClientHtml } from './clientSource';
import { set as mementoSet, get as mementoGet } from '../memento';
import { goToTrace } from '../codeUtil/codeNav';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('GraphViewHost');

const mementoKey = 'dbux-code.GraphWebView.Column';
const defaultColumn = ViewColumn.Two;

export default class GraphWebView {
  extensionContext;

  panel;
  hostComponentManager;
  resourcePath;

  constructor(extensionContext) {
    this.extensionContext = extensionContext;
    this.restorePreviousState();
  }

  _getPreviousState() {
    return mementoGet(mementoKey);
  }

  async _setCurrentState(state) {
    return mementoSet(mementoKey, state);
  }

  restorePreviousState() {
    let state = this._getPreviousState();
    if (state) {
      this.show();
    }
  }

  _getViewColumn() {
    return this._getPreviousState() || defaultColumn;
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

  reveal() {
    if (this.panel) {
      // reveal
      this.panel.reveal(this._getViewColumn());
      return true;
    }
    return false;
  }

  // ###########################################################################
  // initialization
  // ###########################################################################

  /**
   * hackfix: this is necessary because webview won't update if the `html` value is not different from previous assignment.
   */
  _webviewUpdateToken = 0;
  _messageHandler;

  _buildHostIpcAdapterVsCode(webview) {
    return {
      postMessage(msg) {
        webview.postMessage(msg);
      },

      onMessage: ((cb) => {
        // registering new event handler (happens when new Ipc object is initialized)
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
      // eslint-disable-next-line no-extra-bind
      }).bind(this)
    };
  }

  _createWebview() {
    const webviewId = 'dbux-graph';
    const title = 'Call Graph';

    let viewColumn = this._getViewColumn();
    this._setCurrentState(viewColumn);

    this.panel = window.createWebviewPanel(
      webviewId,
      title,
      viewColumn, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(this.resourcePath)]
      }
    );

    this.panel.onDidChangeViewState(
      this.handleDidChangeViewState,
      null,
      this.extensionContext.subscriptions);

    // cleanup
    this.panel.onDidDispose(
      () => {
        // do further cleanup operations
        this.panel = null;
        this._setCurrentState(null);
      },
      null,
      this.extensionContext.subscriptions
    );
  }

  /**
   * NOTE: this callback might be called more than once.
   */
  _started = (manager) => {
    // (re-)started!
    this.hostComponentManager = manager;
  }


  // ###########################################################################
  // restart
  // ###########################################################################

  restart = async () => {
    // set HTML content + restart
    this._restartHost();
    await this._restartClientDOM();
  }

  _restartHost() {
    const ipcAdapter = this._buildHostIpcAdapterVsCode(this.panel.webview);
    startGraphHost(this._started, this.restart, ipcAdapter, this.externals);
  }

  async _restartClientDOM() {
    const scriptPath = path.join(this.resourcePath, 'dist', 'graph.js');
    const html = await buildWebviewClientHtml(scriptPath);
    this.panel.webview.html = html + `<!-- ${++this._webviewUpdateToken} -->`;
  }


  // ###########################################################################
  // onDidChangeViewState
  // ###########################################################################

  /**
   * BIG NOTE: `onDidChangeViewState` event is triggered when webview is moved or hidden.
   *    When moving a webview, it actually gets hidden and revealed again briefly.
   *    Either way it always destroys the entire webview's state.
   *    Since we do not have any persistence, we need to reset the whole thing for now.
   * 
   * @see https://code.visualstudio.com/api/extension-guides/webview#persistence
   */
  handleDidChangeViewState = async ({ webviewPanel }) => {
    const { viewColumn } = webviewPanel;
    // const { oldViewColumn, wasVisible } = this;
    await this._setCurrentState(viewColumn);

    // if (webviewPanel.visible) {
    //   this.wasVisible = true;
    //   if (!wasVisible || viewColumn !== oldViewColumn) {
    //     // WebView View state actually changed -> restart necessary
    //     this.oldViewColumn = viewColumn;
    //     this.restart();
    //   }
    // }
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    /**
     * Used for the "Restart" button
     */
    restart: this.restart,

    logClientError(args) {
      logError('[CLIENT ERORR]', ...args);
    },

    async confirm(message, modal = true) {
      const cfg = { modal };
      const result = await window.showInformationMessage(message, cfg, 'Ok');
      return result === 'Ok';
    },

    alert(message, modal = true) {
      const cfg = { modal };
      window.showInformationMessage(message, cfg, 'Ok');
    },

    async prompt(message) {
      const result = await window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: message
      });
      return result;
    },

    async goToTrace(trace) {
      await goToTrace(trace);
    }
  }
}