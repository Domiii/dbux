// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('../dbux-cli/lib/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');

const path = require('path');
const fs = require('fs');
const merge = require('lodash/merge');
const isArray = require('lodash/isArray');
const isString = require('lodash/isString');
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

  const nonUserCommandsById = {};
  packageJson.contributes.menus.commandPalette
    .filter(cmd => cmd.when === 'false' || cmd.when.includes('dbux.context.nodeEnv == development'))
    .forEach(cmd => nonUserCommandsById[cmd.command] = cmd);

  const oldCommandById = {};
  commandJson
    .forEach(cmd => oldCommandById[cmd.command] = cmd);

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
// replace directives
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

    function mapVal(val, key) {
      // console.debug('cfg', key, val, val === '--esnext');
      if (val === '--esnext') {
        // hackfix
        return "<span style='white-space:nowrap;'>--esnext</span>";
      }
      return isString(val) ? val : JSON.stringify(val);
    }

    let config = pkg.contributes.configuration.
      map(
        cfg => /* console.warn(cfg.properties) || */ Object.entries(cfg.properties).
          map(([entry, { scope, ...props }]) => ({
            entry,
            ...mapValues(props, mapVal)
          }))
      ).
      flat();
    return tablemark(config);
  }
};

function replaceDirectives(s, fpath) {
  // see https://stackoverflow.com/questions/2575791/javascript-multiline-regexp-replace
  return s.replace(/(<!--\s*dbux:(\w+) start\s*-->)([\s\S]*?)(<!--\s*dbux:(\w+) end\s*-->)/g,
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
}

// ###########################################################################
// urls
// ###########################################################################

const RootUrl = 'https://github.com/Domiii/dbux/tree/master/';

// e.g. https://domiii.github.io/dbux/img/nav1.png
const GithubPagesUrl = 'https://domiii.github.io/dbux/';

/**
 * Fix url for packaging VSCode extension.
 * Essentially: just make it absolute to avoid any problems.
 */
function fixUrl(url, fpath, relativePath, raw = false) {
  // if (isAbsolute(url)) {
  let newUrl;
  if (url.startsWith('https:') || url.startsWith('#')) {
    newUrl = url;
  }
  else {
    // try: `node -e "console.log(new URL('../d', 'http://a.b/c/X/').toString()); // http://a.b/c/d"`
    const slash1 = !RootUrl.endsWith('/') && '/' || '';
    const slash2 = !relativePath.endsWith('/') && '/' || '';
    const base = `${RootUrl}${slash1}${relativePath}${slash2}`;
    newUrl = new URL(url, base).toString();
  }

  if (raw && newUrl.startsWith(RootUrl)) {
    // raw URLs need to go through Github Pages
    newUrl = newUrl.replace(RootUrl, GithubPagesUrl);
  }

  if (newUrl !== url) {
    console.debug(`  Replacing url: ${url} -> ${newUrl}`);
  }

  return newUrl;
}

function fixUrls(s, cb, fpath, relativePath) {
  // s = '<img src="abc"> <img src="def">';
  // s = 'x [a](b) y [c](d)z';
  // why doesn't this work -> '![a](b)'.replace(/((?!!)\[.*?\]\()(.*?)(\))/g, (_all, pref, url, suf) => `${pref}X${url}X${suf}`)
  const replacer = (_all, pref, url, suf) => `${pref}${cb(url, fpath, relativePath, false)}${suf}`;
  const replacerRaw = (_all, pref, url, suf) => `${pref}${cb(url, fpath, relativePath, true)}${suf}`;

  s = s.replace(/(<a.*?href=")(.*?)(")/g, replacer);
  s = s.replace(/([^!]\[.*?\]\()(.*?)(\))/g, replacer);
  s = s.replace(/(!\[.*?\]\()(.*?)(\))/g, replacerRaw);
  s = s.replace(/(<img.*?src=")(.*?)(")/g, replacerRaw);

  return s;
}


// ###########################################################################
// markdown core
// ###########################################################################

function replaceInMarkdown(fpath, relativePath) {
  // var s = '<!-- dbux:commands start --> hi <!-- dbux:commands end -->';
  let s = fs.readFileSync(fpath, 'utf-8');

  // replace <!-- dbux:directives -->
  s = replaceDirectives(s, fpath);

  // fix `src`s, `href`s and [markdown](urls)
  s = fixUrls(s, fixUrl, fpath, relativePath);

  fs.writeFileSync(fpath, s);
}

function replaceInMarkdownFiles() {
  replaceInMarkdown(getPath('dbux-code/README.md'), 'dbux-code');
}


module.exports = {
  syncUserCommands: syncCodeCommands,
  replaceInMarkdownFiles
};

replaceInMarkdownFiles();
// console.log(markdownReplacers.codeConfig());