import { window, workspace } from 'vscode';
import path from 'path';
import fs from 'fs';
// import { stringify as jsonStringify } from 'comment-json';
import allApplications from 'dbux-data/src/applications/allApplications';
import { newFileLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { getSelectedApplicationInActiveEditor, getSelectedApplicationInActiveEditorWithUserFeedback } from '../codeUtil/CodeApplication';
import { showGraphView } from '../graphView';

const { log, debug, warn, error: logError } = newFileLogger(__filename);


export function initUserCommands(context) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################
  function serialize(data) {
    // return jsonStringify(data);

    return JSON.stringify(data, null, 2);
  }

  async function doExport(application) {
    const exportFolder = path.join(__dirname, '../../analysis/__data__/');
    const applicationName = application.getSafeFileName();
    // const folder = path.dirname(application.entryPointPath);
    // const fpath = path.join(folder, '_data.json');
    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder);
    }

    const exportFpath = path.join(exportFolder, `${applicationName || '(unknown)'}_data.json`);
    const data = application.dataProvider.serialize();
    fs.writeFileSync(exportFpath, serialize(data));

    const btns = {
      Open: async () => {
        await showTextDocument(exportFpath);
      }
    };
    const msg = `File saved successfully: ${exportFpath}`;
    debug(msg);
    const clicked = await window.showInformationMessage(msg,
      ...Object.keys(btns));
    if (clicked) {
      btns[clicked]();
    }
  }

  registerCommand(context, 'dbux.exportApplicationData', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    await doExport(application);
  });


  // ###########################################################################
  // show graph view
  // ###########################################################################

  registerCommand(context, 'dbux.showGraphView', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    await showGraphView(context, application);
  });
}