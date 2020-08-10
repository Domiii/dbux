import { promises as fs } from 'fs';


/**
 * Properly and safely serialize any JavaScript string for embedding in a website.
 *
 * @see https://stackoverflow.com/questions/14780858/escape-in-script-tag-contents/60929079#60929079
 */
export function wrapScriptTag(src) {
  src = src.replace(/<\/script>/g, '\\x3c/script>');
  src = `${src};`;
  src = JSON.stringify(src);
  const script = `<script>eval(eval(${src}))</script>`;
  return script;
}

/**
 * Loads the script from given path and wraps it in a <script> element.
 */
export async function wrapScriptFileInTag(scriptPath) {
  const src = await fs.readFile(scriptPath, "utf8");
  return wrapScriptTag(src);
  // NOTE: "panel.webview.asWebviewUri" errors out ("unknown url scheme")
  // let graphJsUri = Uri.file(scriptPath);
  // graphJsUri = panel.webview.asWebviewUri(graphJsUri);
  // return `<script src="${graphjsUri.toString()}"></script>`;
}