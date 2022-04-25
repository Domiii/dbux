const fs = require('fs');
const { Console } = require('console');

const DBUX_CODE_PACKAGE_JSON_PATH = '../../dbux-code/package.json';
const OUT_FILE_PATH = './commands.txt';

const { log, table } = new Console(fs.createWriteStream(OUT_FILE_PATH));

const packageJson = JSON.parse(fs.readFileSync(DBUX_CODE_PACKAGE_JSON_PATH));

const { commands } = packageJson.contributes;
const commandsById = new Map();
for (const command of commands) {
  commandsById.set(command.command, command);
}

/** ###########################################################################
 * parse data
 *  #########################################################################*/

const editorButtons = packageJson.contributes.menus['editor/title'].map(({ command: commandId }) => {
  const command = commandsById.get(commandId);
  return {
    title: command.title,
    commandId
  };
});

const viewButtons = packageJson.contributes.menus['view/title'].map(({ command: commandId, when }) => {
  const command = commandsById.get(commandId);
  const view = when.match(/view == (\w*)/g)?.map(s => s.slice(8)).join(', ');
  const icon = command.icon.dark.split('/')[2];
  return {
    title: command.title,
    commandId,
    view,
    icon
  };
});

const treeNodeButtons = packageJson.contributes.menus['view/item/context'].map(({ command: commandId, when }) => {
  const command = commandsById.get(commandId);
  const view = when.match(/viewItem == (\w*)/g)?.map(s => s.slice(12)).join(', ');
  const icon = command.icon.dark.split('/')[2];
  return {
    title: command.title,
    commandId,
    view,
    icon
  };
});

const commandPaletteCommands = packageJson.contributes.menus.commandPalette.filter(({ when }) => {
  return when !== 'false';
}).map(({ command: commandId }) => {
  const command = commandsById.get(commandId);
  return {
    title: command.title,
    commandId
  };
});

/** ###########################################################################
 * Logging
 *  #########################################################################*/

log('editor buttons:');
table(editorButtons);
log('view title buttons:');
table(viewButtons);
log('treeNode buttons:');
table(treeNodeButtons);
log('commandPalette commands:');
table(commandPaletteCommands);

/** ###########################################################################
 * sanity check
 *  #########################################################################*/

function testCommandPaletteCommandsHasPrefix() {
  const availablePrefixes = ['Dbux: ', 'Dbux Project: ', 'Dbux Dev: ', 'Dbux Pathways: '];

  for (const command of commandPaletteCommands) {
    let validFlag = false;
    for (const prefix of availablePrefixes) {
      if (command.title.startsWith(prefix)) {
        validFlag = true;
        break;
      }
    }
    if (!validFlag) {
      console.warn(`Title of command ${JSON.stringify(command)} does not start with available prefix: "${availablePrefixes.join(', ')}"`);
    }
  }
}

testCommandPaletteCommandsHasPrefix();