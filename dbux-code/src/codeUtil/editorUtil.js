import { commands } from 'vscode';

/**
 * Close all editors in the window
 * @param {string} folderPath 
 * @returns 
 */
export async function closeAllEditors() {
  await commands.executeCommand('workbench.action.closeAllEditors');

  /**
   * NOTE: `window.visibleTextEditors` sometimes broken, there is no simple workaround to partially close the related files.
   */
  // await runTaskWithProgressBar(async (progress) => {
  //   progress.report({ message: 'Closing project related files...' });

  //   let textEditor;
  //   while (true) {
  //     if (!isInvalidEditor(textEditor, folderPath)) {
  //       textEditor = window.visibleTextEditors.find(e => isInvalidEditor(e, folderPath));
  //       if (!textEditor) {
  //         break;
  //       }
  //     }
  //     await window.showTextDocument(textEditor.document, textEditor.viewColumn);
  //     textEditor = await closeAndWaitForNextActiveEditor();
  //     console.log(`next active editor: ${textEditor?.document.uri.fsPath}`);
  //   }
  //   const visibleEditors = window.visibleTextEditors;
  //   for (const editor of visibleEditors) {
  //     let currentEditor = editor;
  //     await window.showTextDocument(currentEditor.document, currentEditor.viewColumn);
  //     while (isInvalidEditor(currentEditor, folderPath)) {
  //       await commands.executeCommand('workbench.action.closeActiveEditor');
  //       currentEditor = await waitForNextActiveEditor();
  //     }
  //   }
  // }, { cancellable: false });
}

// /**
//  * Determine if the editor should be closed.
//  * @param {import('vscode').TextEditor} editor 
//  * @param {string} folderPath 
//  * @returns 
//  */
// function isInvalidEditor(editor, folderPath) {
//   if (editor?.document.uri.scheme === 'file' && isSubdirectory(folderPath, editor.document.uri.fsPath)) {
//     return true;
//   }
//   return false;
// }

// async function closeAndWaitForNextActiveEditor() {
//   return new Promise((resolve, reject) => {
//     const subscription = window.onDidChangeActiveTextEditor((editor) => {
//       subscription.dispose();
//       resolve(editor);
//     });
//     commands.executeCommand('workbench.action.closeActiveEditor').catch(reject);
//   });
// }