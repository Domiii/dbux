import {
  window,
  Uri,
  ViewColumn
} from 'vscode';

import path from 'path';
import { promises as fs } from 'fs';

let panel;
let resourcePath;

const defaultColumn = ViewColumn.Two;

function revealGraphView() {
  if (panel) {
    // reveal
    panel.reveal(defaultColumn);
    return true;
  }
  return false;
}

function createGraphView(context) {
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
}


function buildHostIpcAdapterVsCode() {
  return {
    init(webviewWindow, handleMessageEvent) {
      this.webviewWindow = webviewWindow;
    },
    postMessage(msg) {
      this.webviewWindow.postMessage(msg);
    }
  };
}

/**
 * 
 * @see https://github.com/microsoft/vscode-extension-samples/tree/master/webview-sample/media/main.js#L4
 */
function buildGuestAdapterVsCode() {
  return {
    init(handleMessageEvent) {
      this.vscode = acquireVsCodeApi();

      window.addEventListener('message', handleMessageEvent);
    },
    postMessage(msg) {
      this.vscode.postMessage(msg);
    }
  };
}

/**
 * Properly and safely serialize any JavaScript string for embedding in a website.
 *
 * @see https://stackoverflow.com/questions/14780858/escape-in-script-tag-contents/60929079#60929079
 */
function code2Html(src) {
  src = src.replace(/<\/script>/g, '\\x3c/script>');
  src = `${src}; console.log('hi');`;
  src = JSON.stringify(src);
  const script = `<script>eval(eval(${src}))</script>`;
  return script;
}

async function makeScript(scriptPath) {
  const src = await fs.readFile(scriptPath, "utf8");
  return code2Html(src);
  // NOTE: "panel.webview.asWebviewUri" errors out ("unknown url scheme")
  // let graphJsUri = Uri.file(scriptPath);
  // graphJsUri = panel.webview.asWebviewUri(graphJsUri);
  // return `<script src="${graphjsUri.toString()}"></script>`;
}


/**
 * @see https://code.visualstudio.com/api/extension-guides/webview
 */
export async function showGraphView(context, application) {
  resourcePath = path.join(context.extensionPath, 'resources');

  // reveal or create
  if (!revealGraphView()) {
    createGraphView(context);
  }
  
  // set HTML content
  // TODO: use remote URL when developing locally to enable hot reload
  const scriptPath = path.join(resourcePath, 'dist', 'graph.js');
  panel.webview.html = await getWebviewRootHtml(scriptPath);
}


async function getWebviewRootHtml(...scriptPaths) {
  const scripts = (
    await Promise.all(
      scriptPaths.map(fpath => makeScript(fpath))
    )
  ).join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test</title>
</head>
<body>
  loading "graph.js"...
  ${scripts}
  <script>
    postMessage({
      func: 'loadData',
      args: ['data/oop1_data.json']
    });
  </script>
</body>
</html>`;
}
