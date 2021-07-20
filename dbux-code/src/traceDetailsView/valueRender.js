import { window, workspace } from 'vscode';
import { isPlainObjectOrArrayCategory } from '@dbux/common/src/types/constants/ValueTypeCategory';
import { showInformationMessage } from '../codeUtil/codeModals';

export function valueRender(valueRef, value) {
  let modalString = '';

  if (valueRef && isPlainObjectOrArrayCategory(valueRef.category)) {
    modalString = JSON.stringify(value);
  }
  else {
    modalString = `${value}`;
  }

  showInformationMessage(modalString, {
    async 'Open In Editor'() {
      return renderValueAsJsonInEditor(value);
    }
  }, { modal: true });
}

export async function renderValueAsJsonInEditor(value, comment = null) {
  comment = comment ? `// ${comment}\n` : '';
  const content = comment + JSON.stringify(value, null, 2);
  const doc = await workspace.openTextDocument({ 
    language: 'jsonc',
    content
  });
  await window.showTextDocument(doc.uri);
}