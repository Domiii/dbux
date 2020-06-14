import { newLogger } from 'dbux-common/src/log/logger';
import { startGraphHost } from 'dbux-graph-host/src/index';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';
import path from 'path';
import { getWebviewClientHtml } from './clientSource';
import { goToTrace } from '../codeUtil/codeNav';

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
      }).bind(this)
    };
  }

  _createWebview() {
    const webviewId = 'dbux-graph';
    const title = 'Call Graph';

    this.oldViewColumn = null;

    this.panel = window.createWebviewPanel(
      webviewId,
      title,
      defaultColumn, // Editor column to show the new webview panel in.
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

  async _restartClientDOM() {
    // TODO: consider using remote URL when developing locally to enable webpack-dev-server's hot reload
    const scriptPath = path.join(this.resourcePath, 'dist', 'graph.js');
    const html = await getWebviewClientHtml(scriptPath);
    this.panel.webview.html = html + `<!-- ${++this._webviewUpdateToken} -->`;
  }

  _restartHost() {
    const ipcAdapter = this._buildHostIpcAdapterVsCode(this.panel.webview);
    startGraphHost(this._started, this.restart, ipcAdapter, this.externals);
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
  handleDidChangeViewState = ({ webviewPanel }) => {
    // const { viewColumn } = webviewPanel;
    // const { oldViewColumn, wasVisible } = this;

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
    restart: this.restart,

    logClientError(args) {
      logError('[CLIENT ERORR]', ...args);
    },

    async confirm(message, modal = true) {
      const cfg = { modal };
      const result = await window.showInformationMessage(message, cfg, 'Ok', 'Cancel');
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