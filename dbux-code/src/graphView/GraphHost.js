import GraphHostBase from 'dbux-graph-host/src/GraphHost';
import {
  window,
  Uri,
  ViewColumn
} from 'vscode';

import path from 'path';
import { promises as fs } from 'fs';


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


export default class GraphHost extends GraphHostBase {
  panel;
  resourcePath;

  constructor(context, application) {
    super();

    this.context = context;
    this.application = application;
  }

  /**
   * @see https://code.visualstudio.com/api/extension-guides/webview
   */
  async show() {
    resourcePath = path.join(context.extensionPath, 'resources');

    // reveal or create
    if (!this.reveal()) {
      this._createGraphView();
    }

    // set HTML content
    // TODO: use remote URL when developing locally to enable hot reload
    const scriptPath = path.join(resourcePath, 'dist', 'graph.js');
    panel.webview.html = await getWebviewRootHtml(scriptPath);
  }

  reveal() {
    if (panel) {
      // reveal
      panel.reveal(defaultColumn);
      return true;
    }
    return false;
  }

  // ###########################################################################
  // initialization
  // ###########################################################################

  _start() {
    const ipcAdapter = buildHostIpcAdapterVsCode(this.panel.webview);
    this.startIpc(ipcAdapter);
  }

  _createWebview() {
    const webviewId = 'dbux-graph';
    const title = 'Graph View';

    panel = window.createWebviewPanel(
      webviewId,
      title,
      defaultColumn, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(resourcePath)]
      }
    );

    // cleanup
    panel.onDidDispose(
      () => {
        // do further cleanup operations
        panel = null;
      },
      null,
      context.subscriptions
    );

    this._start();
  }
}