import {
  window,
  Uri,
  ViewColumn,
  commands,
  ColorThemeKind
} from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { wrapScriptTag, wrapScriptFileInTag } from './domTransformUtil';
import { set as mementoSet, get as mementoGet } from '../memento';
import { getResourcePath } from './codePath';


let _extensionContext;
export function initWebviewWrapper(extensionContext) {
  _extensionContext = extensionContext;
}

export default class WebviewWrapper {
  /**
   * @type {import('vscode').WebviewPanel}
   */
  panel;
  resourceRoot;

  constructor(webviewId, title, preferredColumn = ViewColumn.Two) {
    this.webviewId = webviewId;
    this.title = title;
    this.preferredColumn = preferredColumn;
    this.wasVisible = false;
    this.resourceRoot = getResourcePath();

    this.logger = newLogger(`${title} WebviewWrapper`);
  }

  get isVisible() {
    return this.panel?.visible || false;
  }

  getIcon() {
    return null;
  }

  onDispose(cb) {
    return this.panel.onDidDispose(cb);
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  getThemeMode() {
    return window.activeColorTheme.kind === ColorThemeKind.Light ? ThemeMode.Light : ThemeMode.Dark;
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
    try {
      await mementoSet(this.mementoKey, state);
    }
    catch (err) {
      this.logger.error(`Error when setting memento '${this.mementoKey}' as ${state}`, err);
    }
  }

  async restorePreviousStateAndShow() {
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
    if (!this.panel) {
      this._createWebview();
      await this.restart();
    }
    else {
      this.panel.reveal(this.getPreferredViewColumn());
    }
  }

  dispose() {
    this.panel?.dispose();
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

      onError: (...args) => {
        this.logger.error(...args);
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
              this.logger.error('Failed when processing Client message.\n\n', err);
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
          this.logger.debug('silenced postMessage after Host shutdown:', JSON.stringify(msg));
        };
        ipcAdapter.onMessage = (msg) => {
          // when invoked by remote, we try to send response back after shutdown. This prevents that.
          this.logger.debug('silenced onMessage after Host shutdown:', JSON.stringify(msg));
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
      Uri.file(this.resourceRoot),
      Uri.file(getResourcePath('dist/web'))
    ];

    commands.executeCommand('setContext', `dbuxWebView.context.${this.webviewId}.isActive`, true);

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
        this.shutdownHost();
        this._setCurrentState(null);
        commands.executeCommand('setContext', `dbuxWebView.context.${this.webviewId}.isActive`, false);
      },
      null,
      _extensionContext.subscriptions
    );
  }

  // ###########################################################################
  // shutdown + restart
  // ###########################################################################

  /**
   * Check if we showed it before, and if so, show it again.
   * Usually called upon start-up.
   */
  async init() {
    return this.restorePreviousStateAndShow();
  }

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
    const { webview } = this.panel;
    let html = await this.buildClientHtml();
    //     /**
    //      * @see https://code.visualstudio.com/api/extension-guides/webview#content-security-policy
    //      * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy#example
    //      */
    //     const allowedScripts = `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`;
    //     const allowedCss = `https://fonts.googleapis.com`;
    //     const csp = `<meta
    //   http-equiv="Content-Security-Policy"
    //   content="\
    //     img-src 'self' 'unsafe-inline' ${webview.cspSource}; \
    //     script-src 'self' 'unsafe-inline' 'unsafe-eval' ${webview.cspSource} ${allowedScripts}; \
    //     style-src 'self' 'unsafe-inline' ${webview.cspSource} ${allowedCss};\
    //   "
    // />`;
    // NOTE: CSP stuff still seems immature (2/2022) and vastly underdocumented. Will need to revisit in the future.
    const csp = '';

    html = `
<script>
  window._WebResourceRoot = ${JSON.stringify(this.resourceRoot)};
</script>
${csp}
${html}
<!-- ${++this._webviewUpdateToken} -->`;
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
    this._setCurrentState(this.preferredColumn);

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
