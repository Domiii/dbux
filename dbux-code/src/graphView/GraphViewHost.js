import { startGraphHost } from 'dbux-graph-host';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';

import path from 'path';


const defaultColumn = ViewColumn.Two;

function buildHostIpcAdapterVsCode() {
  return {
    init(webview) {
      this.webview = webview;
    },
    postMessage(msg) {
      this.webview.postMessage(msg);
    }
  };
}


export default class GraphHost {
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
      this._createGraphView();
    }

    // set HTML content
    // TODO: use remote URL when developing locally to enable hot reload
    const scriptPath = path.join(this.resourcePath, 'dist', 'graph.js');
    this.panel.webview.html = await getWebviewRootHtml(scriptPath);
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

  _start() {
    const ipcAdapter = buildHostIpcAdapterVsCode(this.panel.webview);
    this.hostComponentManager = startGraphHost(ipcAdapter);
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

    this._start();
  }
}