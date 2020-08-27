import {
  window,
  Uri,
  ViewColumn,
  commands
} from 'vscode';
import path from 'path';
import { newLogger } from '@dbux/common/src/log/logger';
import { wrapScriptTag, wrapScriptFileInTag } from './domTransformUtil';
import { set as mementoSet, get as mementoGet } from '../memento';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('WebviewWrapper');


let _extensionContext;
export function initWebviewWrapper(extensionContext) {
  _extensionContext = extensionContext;
}

export default class WebviewWrapper {
  panel;
  resourceRoot;

  constructor(webviewId, title, preferredColumn = ViewColumn.Two) {
    this.webviewId = webviewId;
    this.title = title;
    this.preferredColumn = preferredColumn;
    this.wasVisible = false;
    this.resourceRoot = path.join(_extensionContext.extensionPath, 'resources');
  }

  getIcon() {
    return null;
  }

  /**
   * Check if we showed it before, and if so, show it again.
   * Usually called upon start-up.
   */
  async init() {
    return this.restorePreviousState();
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  getResourcePath(...pathSegments) {
    return path.join(this.resourceRoot, ...pathSegments);
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

  async restorePreviousState() {
    let state = this._getPreviousState();
    if (state) {
      await this.show();
    }
  }

  getPreferredViewColumn() {
    return this._getPreviousState() || this.preferredColumn;
  }

  // ###########################################################################
  // show/hide, reveal
  // ###########################################################################

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

  hide() {
    if (this.panel) {
      this.panel.dispose();
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
          _extensionContext.subscriptions
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
    this._setCurrentState(viewColumn);

    const localResourceRoots = [
      Uri.file(this.resourceRoot)
    ];

    commands.executeCommand('setContext', 'dbuxWebView.context.isActive', true);

    this.panel = window.createWebviewPanel(
      this.webviewId,
      this.title,
      viewColumn, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots
      }
    );
    this.wasVisible = true;

    this.panel.iconPath = this.getIcon();

    this.panel.onDidChangeViewState(
      this.handleDidChangeViewState,
      null,
      _extensionContext.subscriptions);

    // cleanup
    this.panel.onDidDispose(
      () => {
        // do further cleanup operations
        this.panel = null;
        this._setCurrentState(null);
        commands.executeCommand('setContext', 'dbuxWebView.context.isActive', false);
      },
      null,
      _extensionContext.subscriptions
    );
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
    let html = await this.buildClientHtml();
    html = html + `<!-- ${++this._webviewUpdateToken} -->`;
    this.panel.webview.html = html;
    // this.panel.webview.html = 'asd!!';
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
    this._setCurrentState(this.preferredColumn).catch((err) => {
      logError(err);
    });

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

  // ###########################################################################
  // HTML content utilities
  // ###########################################################################

  static wrapScriptTag = wrapScriptTag;
  static wrapScriptFileInTag = wrapScriptFileInTag;
}