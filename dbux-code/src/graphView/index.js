import {
  window,
  Uri,
  ViewColumn
} from 'vscode';

import path from 'path';

let panel;
let graphResourcePath;

function createGraphView(context) {
  const defaultColumn = ViewColumn.Two;
  if (panel) {
    // reveal
    panel.reveal(defaultColumn);
    return;
  }

  const webviewId = 'dbux-graph';
  const title = 'Graph View';

  panel = window.createWebviewPanel(
    webviewId,
    title,
    defaultColumn, // Editor column to show the new webview panel in.
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(graphResourcePath)]
    }
  );

  // cleanup
  panel.onDidDispose(
    () => {
      // do further cleanup operations
    },
    null,
    context.subscriptions
  );
}

/**
 * @see https://code.visualstudio.com/api/extension-guides/webview
 */
export async function showGraphView(context, application) {
  graphResourcePath = path.join(context.extensionPath, 'resources', 'graph');

  // create (if not existing yet)
  createGraphView(context);
  
  const graphjsPath = Uri.file(path.join(graphResourcePath, 'graph.js'));
  const graphjsUri = panel.webview.asWebviewUri(graphjsPath);

  // set HTML content
  panel.webview.html = getWebviewRootHtml(graphjsUri);
}

function getWebviewRootHtml(graphjsUri) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test</title>
</head>
<body>
  loading "${graphjsUri.toString()}"...
  <script src="${graphjsUri.toString()}"></script>
</body>
</html>`;
}
