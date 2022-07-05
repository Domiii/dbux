// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('../dbux-register-self');
require('../../dbux-common/src/util/prettyLogs');

const path = require('path');
const fs = require('fs');
const merge = require('lodash/merge');
const isArray = require('lodash/isArray');
// const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

const { readPackageJson } = require('../../dbux-cli/lib/package-util');

function getDbuxPath(...segments) {
  return path.resolve(__dirname, '../..', ...segments);
}

function getCommandJsonPath() {
  return getDbuxPath('docs_site/data/commands.json');
}

function readCodePackageJson() {
  return readPackageJson(getDbuxPath('dbux-code'));
}

function writeJsonFile(fpath, obj) {
  const s = JSON.stringify(obj, null, 2);
  fs.writeFileSync(fpath, s);
}

function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}


module.exports = function updateAndGetDbuxCodePackageData() {
  const commandJsonPath = getCommandJsonPath();
  const packageJson = readCodePackageJson();
  const commandJson = readJsonFile(commandJsonPath);

  if (!isArray(commandJson)) {
    throw new Error('commands.json should be an array');
  }

  const allCommandsById = {};
  packageJson.contributes.commands
    .forEach(cmd => allCommandsById[cmd.command] = cmd);

  const nonUserCommandsById = {};
  packageJson.contributes.menus.commandPalette
    .filter(cmd => cmd.when === 'false')
    .forEach(cmd => {
      if (cmd.when.includes('dbux.context.nodeEnv == development')) {
        cmd.dev = true;
      }
      nonUserCommandsById[cmd.command] = cmd;
    });

  const oldCommandsById = {};
  commandJson
    .forEach(cmd => oldCommandsById[cmd.command] = cmd);

  // check: if buttonCommands are in allCommands section
  for (const id in nonUserCommandsById) {
    if (!allCommandsById[id]) {
      throw new Error(`Button command '${id}' should be listed in 'contributes.commands' section`);
    }
  }

  const newUserCommandsById = {};
  Object.keys(allCommandsById)
    .filter(id => !nonUserCommandsById[id])
    .map(id => allCommandsById[id])
    .forEach(cmd => newUserCommandsById[cmd.command] = cmd);

  // delete old unused commands
  for (const id in oldCommandsById) {
    if (!newUserCommandsById[id]) {
      delete oldCommandsById[id];
    }
  }

  // merge userCommands to commandFile
  for (const id in newUserCommandsById) {
    oldCommandsById[id] = merge(oldCommandsById[id] || {}, newUserCommandsById[id]);
  }

  // check: description exist and remove icon
  for (const id in oldCommandsById) {
    const cmd = oldCommandsById[id];
    cmd.description = cmd.description || '';
    delete cmd.icon;
  }

  const commandData = Object.values(oldCommandsById).sort((a, b) => {
    if (a.command < b.command) {
      return -1;
    }
    if (a.command > b.command) {
      return 1;
    }
    return 0;
  });

  // write to file
  writeJsonFile(commandJsonPath, commandData);

  // return
  return commandData;
};

// Object.assign(module.exports, {
//   getCommandJsonPath
// });
