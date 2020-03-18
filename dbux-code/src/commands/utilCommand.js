import { window } from 'vscode';
import { writeFile } from 'fs';
import { resolve, join } from 'path';
import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';

const { log, error: logError } = newLogger('UtilCommands');

function writeStringToFile(fileName, dataString) {
  writeFile(fileName, dataString, function (err) {
    if (err) logError(err);
    else window.showInformationMessage(`Data saved as ${join(resolve('./'), fileName)}`);
  });
}

function writeDbuxData() {
  // TODO: get dbux data to write(set fileName, outputString)
  const fileName = 'test.json';
  const outputString = JSON.stringify({ test: 123, meow: 456 });
  writeStringToFile(fileName, outputString);
}

export function initUtilCommands(context) {
  registerCommand(context,
    'dbux.export',
    writeDbuxData,
    true
  );
}