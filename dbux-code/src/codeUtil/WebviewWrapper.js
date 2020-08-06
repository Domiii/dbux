import { newLogger } from '@dbux/common/src/log/logger';
import { startGraphHost, shutdownGraphHost } from '@dbux/graph-host/src/index';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';
import path from 'path';
import { set as mementoSet, get as mementoGet } from '../memento';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('WebviewWrapper');

export default class WebviewWrapper {
  extensionContext;

  panel;
  hostComponentManager;
  resourcePath;

  constructor(extensionContext, webviewId, title, preferredColumn = ViewColumn.Two) {
    this.extensionContext = extensionContext;
    this.webviewId = webviewId;
    this.title = title;
    this.preferredColumn = preferredColumn;
    this.wasVisible = false;
    this.resourcePath = path.join(this.extensionContext.extensionPath, 'resources');

    this.restorePreviousState();
  }

  // ###########################################################################
  // Manage view column
  // ###########################################################################

  get mementoKey() {
    return 'webview.' + this.webviewId;
  }

  _getPreviousState() {
    return mementoGet(this.mementoKey);
  }

  async _setCurrentState(state) {
    return mementoSet(this.mementoKey, state);
  }

  restorePreviousState() {
    let state = this._getPreviousState();
    if (state) {
      this.show();
    }
  }

  getPreferredViewColumn() {
    return this._getPreviousState() || this.preferredColumn;
  }

  /**
   * @see https://code.visualstudio.com/api/extension-guides/webview
   */
  async show() {
    // reveal or create
    if (!this.reveal()) {
      this._createWebview();
      await this.restart();
    }
  }

  reveal() {
    if (this.panel) {
      // reveal
      this.panel.reveal(this.getPreferredViewColumn());
      return true;
    }
    return false;
  }

  // ###########################################################################
  // initialization
  // ###########################################################################

  _messageHandler;

  /**
   * Build a somewhat standardized `ipcAdapter` for easier communication.
   * Also plugs into dbux-graph-common's `Ipc` class.
   */
  _buildHostIpcAdapterVsCode(webview) {
    const ipcAdapter = {
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
      }).bind(this),

      dispose: (() => {
        ipcAdapter.postMessage = (msg) => {
          // when invoked by remote, we try to send response back after shutdown. This prevents that.
          debug('silenced postMessage after Host shutdown:', JSON.stringify(msg));
        };
        ipcAdapter.onMessage = (msg) => {
          // when invoked by remote, we try to send response back after shutdown. This prevents that.
          debug('silenced onMessage after Host shutdown:', JSON.stringify(msg));
        };
        this._messageHandler?.dispose();
        // eslint-disable-next-line no-extra-bind
      }).bind(this)
    };

    return ipcAdapter;
  }

  _createWebview() {
    let viewColumn = this.getPreferredViewColumn();

    this.panel = window.createWebviewPanel(
      this.webviewId,
      this.title,
      viewColumn, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(this.resourcePath)]
      }
    );
    this.wasVisible = true;

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
  // shutdown + restart
  // ###########################################################################

  restart = async () => {
    // set HTML content + restart
    await this._restartHost();
    await this._restartClientDOM();
  }

  /**
   * hackfix: this is necessary because webview won't update if the `html` value is not different from previous assignment.
   */
  _webviewUpdateToken = 0;

  async _restartClientDOM() {
    const html = this.buildClientHtml();
    this.panel.webview.html = html + `<!-- ${++this._webviewUpdateToken} -->`;
  }

  async _restartHost() {
    const ipcAdapter = this._buildHostIpcAdapterVsCode(this.panel.webview);
    this.startHost(ipcAdapter);
  }

  // ###########################################################################
  // Abstract methods
  // ###########################################################################

  shutdownHost() {
    throw new Error('abstract method not implemented');
  }


  async buildClientHtml() {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async startHost(ipcAdapter) {
    throw new Error('abstract method not implemented');
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
    // debug('handleDidChangeViewState', webviewPanel.visible, performance.now());
    this.preferredColumn = webviewPanel.viewColumn;

    // on closed, silent shutdown
    if (this.wasVisible && !webviewPanel.visible) {
      this.wasVisible = webviewPanel.visible;
      this.shutdownHost();
      this.panel && (this.panel.webview.html = '');
    }

    // on open
    if (!this.wasVisible && webviewPanel.visible) {
      this.wasVisible = webviewPanel.visible;
      this.restart();
    }
  }
}