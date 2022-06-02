import { ViewColumn, window, workspace } from 'vscode';
// import { isPlainObjectOrArrayCategory } from '@dbux/common/src/types/constants/ValueTypeCategory';
import { showInformationMessage } from '../codeUtil/codeModals';

/**
 * @type {import('vscode').TextEditor}
 */
let lastRenderEditor;

export function valueRender(value) {
  let modalString = '';

  // if (valueRef && isPlainObjectOrArrayCategory(valueRef.category)) {
  modalString = JSON.stringify(value);
  // }

  showInformationMessage(`${modalString}`, {
    async 'Open In Editor'() {
      return renderValueAsJsonInEditor(value);
    }
  }, { modal: true });
}

export async function renderValueAsJsonInEditor(value, comment = null) {
  let content = JSON.stringify(value, null, 2);

  // hackfix: render multi-line strings a bit better
  // console.log(JSON.stringify('hi\nqwer\\node_modules').replace(/(?<!\\)\\n/g, '" +\n"'))
  content = content.replace(/(?<!\\)\\n/g, '" +\n"');

  comment = comment ? `// ${comment}\n` : '';
  content = comment + content;

  await renderStringInNewEditor('javascript', content);
}

export async function renderStringInNewEditor(language, content) {
  if (lastRenderEditor) {
    // TODO: the VSCode API has no way to close an editor
    // lastRenderEditor.
  }

  const doc = await workspace.openTextDocument({
    language,
    content
  });
  return lastRenderEditor = await window.showTextDocument(doc.uri, { viewColumn: ViewColumn.One });
}
