import { wrapScriptFileInTag, wrapCssFileInTag } from '../codeUtil/domTransformUtil';

export async function buildWebviewClientHtml(scriptPaths, themePath) {
  const tags = (
    await Promise.all([
      ...scriptPaths.map(fpath => wrapScriptFileInTag(fpath)),
      wrapCssFileInTag(themePath)
    ])
  ).join('\n  ');

  // <!DOCTYPE html>
  // <html lang="en">
  // <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>Test</title>
  // </head>
  // <body>
  return (/*html*/ `
  <div id="root"></div>

  ${tags}
  <script>
    function main() {
      window.x = (window.x || 0) + 1;
      // console.debug('Client main', x);
      if (window.__dbuxComponentManager) {
        // started this before -> need to tear down, and go again?
        componentManager.restart();
        console.debug('Sending restart request...');
        return;
      }
      console.debug('Client init');

      /**
        * 
        * @see https://github.com/microsoft/vscode-extension-samples/tree/master/webview-sample/media/main.js#L4
        */
      const vscode = acquireVsCodeApi();
      let messageHandler;

      const ipcAdapter = {
        postMessage(msg) {
          vscode.postMessage(msg);
        },
        onMessage(cb) {
          if (messageHandler) {
            // remove previous handler -> only allow one at a time
            window.removeEventListener('message', messageHandler);
          }
          
          window.addEventListener('message', messageHandler = (evt) => {
            const message = evt.data;
            cb(message);
          });
        }
      };
      window.__dbuxComponentManager = startDbuxGraphClient(ipcAdapter);
    }

    main();
  </script>
  `);
  // </body>
  // </html>
}
