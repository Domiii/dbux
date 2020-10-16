import { newLogger } from '@dbux/common/src/log/logger';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import {
  window,
  Uri
} from 'vscode';
import { buildWebviewClientHtml } from './clientSource';
import WebviewWrapper from '../codeUtil/WebviewWrapper';

/** @typedef {import('@dbux/graph-host/src/WebHost').HostWrapper} HostWrapper */

export default class RichWebView extends WebviewWrapper {
  /**
   * @type {HostWrapper}
   */
  hostWrapper;
  hostComponentManager;
  logger;

  constructor(HostWrapperClazz, id, col) {
    const hostWrapper = new HostWrapperClazz();
    const { name } = hostWrapper;
    super(id, name, col);

    this.hostWrapper = hostWrapper;
    this.logger = newLogger(name);
  }

  getMainScriptPath() {
    throw new Error('abstract method not implemented');
  }

  /**
   * Event handler callback
   */
  handleGraphHostStarted = (manager) => {
    // (re-)started!
    this.hostComponentManager = manager;
  }

  async buildClientHtml() {
    const mode = this.getThemeMode();
    const scriptPath = this.getResourcePath(this.getMainScriptPath());
    const modeFolderName = ThemeMode.getName(mode).toLowerCase();
    const themePath = this.getResourcePath(`dist/web/${modeFolderName}/bootstrap.min.css`);
    return await buildWebviewClientHtml([scriptPath], themePath);
  }

  async startHost(ipcAdapter) {
    this.hostWrapper.startGraphHost(this.handleGraphHostStarted, this.restart, ipcAdapter, this.getExternals());
  }

  shutdownHost() {
    this.hostWrapper.shutdownGraphHost();
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  getExternals() {
    return {
      ...this.sharedExternals,
      ...this.externals
    };
  }

  sharedExternals = {
    /**
     * Used for the "Restart" button
     */
    restart: this.restart,

    logClientError: (args) => {
      this.logger.error('[CLIENT ERROR]', ...args);
    },

    confirm: async (msg, modal = true) => {
      const confirmText = 'Ok';
      const result = await window.showInformationMessage(msg, { modal }, confirmText, modal ? undefined : 'Cancel');
      return result === confirmText;
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

    getThemeMode: this.getThemeMode,

    getClientResourceUri: (...segments) => {
      const p = this.getResourcePath(...segments);
      const uri = this.panel.webview.asWebviewUri(Uri.file(p));
      return uri.toString();
    }
  }
}