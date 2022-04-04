const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('../../dbux-code/package.json'));

const { commands } = packageJson.contributes;
const commandsById = new Map();
for (const command of commands) {
  commandsById.set(command.command, command);
}

const editorButtons = packageJson.contributes.menus['editor/title'].map(({ command: commandId }) => {
  const command = commandsById.get(commandId);
  return {
    title: command.title,
    commandId
  };
});

// TODO
const viewButtons = packageJson.contributes.menus['view/title'].map(({ command: commandId, when }) => {
  const command = commandsById.get(commandId);
  const view = when.match(/view == (\w*)/g);
  const icon = command.icon.dark.split('/')[2];
  return {
    title: command.title,
    commandId,
    view,
    icon
  };
});
const treeNodeButtons = packageJson.contributes.menus['view/item/context'];
const commandPaletteCommands = packageJson.contributes.menus.commandPalette;

console.log('editor buttons:', editorButtons.length);
console.log('view buttons:', viewButtons);
console.log('treeNode nuttons:', treeNodeButtons.length);
console.log('commandPalette commands:', commandPaletteCommands.length);
