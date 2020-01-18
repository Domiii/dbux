import {
  Disposable,
  workspace,
  window
} from 'vscode';

import { DataProvider, getDefaultDataProvider } from 'dbux-data/src/DataProvider';

let dataProvider: DataProvider;

/**
 * Relevant VSCode API (https://code.visualstudio.com/api/references/vscode-api):
 *  DecorationRenderOptions
 *  DocumentHighlight
 *  DocumentLinkProvider
 *  DocumentRangeFormattingEditProvider
 * 
 */
export function initCodeDeco() {
  dataProvider = getDefaultDataProvider();
}


function renderDecorations() {
  const editor = window.activeTextEditor;

  if (!editor || !editor.document) {
    return;
  }
  const { document } = editor;
  const currentLanguage = document.languageId;

  const isLanguageEnabled = !!this.metricsUtil.selector.find(s => s.language === currentLanguage);

}