import { promises as fs } from 'fs';

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
 * 
 * @see https://github.com/microsoft/vscode-extension-samples/tree/master/webview-sample/media/main.js#L4
 */
function buildGuestAdapterVsCode() {
  return {
    init(handleMessageEvent) {
      this.vscode = window.acquireVsCodeApi();

      window.addEventListener('message', handleMessageEvent);
    },
    postMessage(msg) {
      this.vscode.postMessage(msg);
    }
  };
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
