import { window, workspace } from 'vscode';
import { isPlainObjectOrArrayCategory } from '@dbux/common/src/core/constants/ValueTypeCategory';
import { showInformationMessage } from '../codeUtil/codeModals';

export function valueRender(valueRef, value) {
  let confirmString = '';
  let documentString = '';

  if (valueRef && isPlainObjectOrArrayCategory(valueRef.category)) {
    confirmString = JSON.stringify(value);
    documentString = JSON.stringify(value, null, 2);
  }
  else {
    documentString = confirmString = `${value}`;
  }
  showInformationMessage(confirmString, {
    async 'Open In Editor'() {
      const doc = await workspace.openTextDocument({ 
        language: 'jsonc',
        content: documentString
      });
      await window.showTextDocument(doc.uri);
    }
  }, { modal: true });
}