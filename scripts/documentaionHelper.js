// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('../dbux-cli/lib/dbux-register-self');
require('@dbux/common/src/util/prettyLogs');

const path = require('path');
const fs = require('fs');
const merge = require('lodash/merge');
const isArray = require('lodash/isArray');
const { readPackageJson } = require('../dbux-cli/lib/package-util');

function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}

function writeJsonFile(fpath, data) {
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2));
}

function syncUserCommand() {
  const commandJsonPath = path.join(__dirname, '..', 'docs', 'commands.json');
  const packageJson = readPackageJson(path.join(__dirname, '..', 'dbux-code'));
  const commandJson = readJsonFile(commandJsonPath);
  
  if (!isArray(commandJson)) {
    throw new Error('commands.json should be an array');
  }

  const allCommandsById = {};
  packageJson.contributes.commands
    .forEach(cmd => allCommandsById[cmd.command] = cmd);

  const buttonCommandsById = {};
  packageJson.contributes.menus.commandPalette
    .filter(cmd => cmd.when === 'false')
    .forEach(cmd => buttonCommandsById[cmd.command] = cmd);

  const oldCommandById = {};
  commandJson
    .forEach(cmd => oldCommandById[cmd.command] = cmd);

  // check: if buttonCommands are in allCommands section
  for (const id in buttonCommandsById) {
    if (!allCommandsById[id]) {
      throw new Error(`Button command '${id}' should be listed in 'contributes.commands' section`);
    }
  }

  const newUserCommandsById = {};
  Object.keys(allCommandsById)
    .filter(id => !buttonCommandsById[id])
    .map(id => allCommandsById[id])
    .forEach(cmd => newUserCommandsById[cmd.command] = cmd);

  // delete old unused commands
  for (const id in oldCommandById) {
    if (!newUserCommandsById[id]) {
      delete oldCommandById[id];
    }
  }

  // merge userCommands to commandFile
  for (const id in newUserCommandsById) {
    oldCommandById[id] = merge(oldCommandById[id] || {}, newUserCommandsById[id]);
  }

  // check: description exist and remove icon
  for (const id in oldCommandById) {
    const cmd = oldCommandById[id];
    cmd.description = cmd.description || '';
    delete cmd.icon;
  }

  const userCommandsToWrite = Object.values(oldCommandById).sort((a, b) => {
    if (a.command < b.command) {
      return -1;
    }
    if (a.command > b.command) {
      return 1;
    }
    return 0;
  });

  writeJsonFile(commandJsonPath, userCommandsToWrite);
}

syncUserCommand();