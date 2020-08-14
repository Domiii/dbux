import { newLogger } from '@dbux/common/src/log/logger';
import { startGraphHost, shutdownGraphHost } from '@dbux/graph-host/src/index';
import {
  window,
  ViewColumn
} from 'vscode';
import { buildWebviewClientHtml } from './clientSource';
import { goToTrace } from '../codeUtil/codeNav';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { getThemeResourcePath } from '../resources';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('GraphViewHost');

const defaultColumn = ViewColumn.Two;

export default class GraphWebView extends WebviewWrapper {
  hostComponentManager;

  constructor() {
    super('dbux-graph', 'Call Graph', defaultColumn);
  }

  getIcon() {
    return getThemeResourcePath('tree.svg');
  }

  /**
   * Event handler callback
   */
  handleGraphHostStarted = (manager) => {
    // (re-)started!
    this.hostComponentManager = manager;
  }

  async buildClientHtml() {
    const scriptPath = this.getResourcePath('dist', 'graph.js');
    return await buildWebviewClientHtml(scriptPath);
  }
  
  async startHost(ipcAdapter) {
    startGraphHost(this.handleGraphHostStarted, this.restart, ipcAdapter, this.externals);
  }

  shutdownHost() {
    shutdownGraphHost();
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