// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('../dbux-cli/lib/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');

const path = require('path');
const fs = require('fs');
const merge = require('lodash/merge');
const isArray = require('lodash/isArray');
const mapValues = require('lodash/mapValues');
const tablemark = require('tablemark');
// const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

const { readPackageJson } = require('../dbux-cli/lib/package-util');

function getPath(...segments) {
  return path.resolve(__dirname, '..', ...segments);
}

function getCommandJsonPath() {
  return getPath('docs', 'commands.json');
}

function readCodePackageJson() {
  return readPackageJson(getPath('dbux-code'));
}

function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}

function writeJsonFile(fpath, data) {
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2));
}

function syncCodeCommands() {
  const commandJsonPath = getCommandJsonPath();
  const packageJson = readCodePackageJson();
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

// ###########################################################################
// work with markdown
// ###########################################################################

const markdownReplacers = {
  codeCommands() {
    syncCodeCommands();
    const commandJsonPath = getCommandJsonPath();
    const commands = readJsonFile(commandJsonPath);
    return tablemark(commands);
    // console.table(
    //   Object.fromEntries(
    //     commands.map(({ command, ...o }) => [command, o])
    //   )
    // );
  },

  codeConfig() {
    const pkg = readCodePackageJson();
    let config = pkg.contributes.configuration.
      map(
        cfg => /* console.warn(cfg.properties) || */ Object.entries(cfg.properties).
          map(([entry, props]) => ({ 
            entry, 
            ...mapValues(props, val => JSON.stringify(val))
          }))
      ).
      flat();
    return tablemark(config);
  }
};

function replaceInMarkdown(fpath) {
  // var s = '<!-- dbux:commands start --> hi <!-- dbux:commands end -->';
  let s = fs.readFileSync(fpath, 'utf-8');

  // see https://stackoverflow.com/questions/2575791/javascript-multiline-regexp-replace
  s = s.replace(/(<!--\s*dbux:(\w+) start\s*-->)([\s\S]*?)(<!--\s*dbux:(\w+) end\s*-->)/g,
    (_all, pref, kind, content, suf, kind2) => {
      // console.log(' match', { pref, kind, content, suf, kind2 });
      if (kind !== kind2) {
        throw new Error(`dbux annotation start<->end not matching in ${fpath}: "${pref}" does not match "${suf}"`);
      }

      const replacer = markdownReplacers[kind];
      if (!replacer) {
        throw new Error(`dbux annotation has invalid kind in ${fpath}: ${kind}`);
      }
      const replacement = replacer();
      return `${pref}\n${replacement}\n${suf}`;
    }
  );

  fs.writeFileSync(fpath, s);
}

function replaceInMarkdownFiles() {
  replaceInMarkdown(getPath('dbux-code/README.md'));
}


module.exports = {
  syncUserCommands: syncCodeCommands,
  replaceInMarkdownFiles
};

replaceInMarkdownFiles();
// console.log(markdownReplacers.codeConfig());