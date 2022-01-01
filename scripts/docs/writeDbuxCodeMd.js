/**
 * @file
 */

// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('../dbux-register-self');
require('../../dbux-common/src/util/prettyLogs');

const fs = require('fs');
const isString = require('lodash/isString');
const mapValues = require('lodash/mapValues');
const tablemark = require('tablemark');
const path = require('path');
const getDbuxCodePackageData = require('./getDbuxCodePackageData');

const { readPackageJson } = require('../../dbux-cli/lib/package-util');


/** ###########################################################################
 * util
 * ##########################################################################*/

function getDbuxPath(...segments) {
  return path.resolve(__dirname, '../..', ...segments);
}

function readCodePackageJson() {
  return readPackageJson(getDbuxPath('dbux-code'));
}

function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}

/** ###########################################################################
 * generators
 * ##########################################################################*/

function genCommandsMd() {
  const commands = getDbuxCodePackageData()
    .filter(cmd => !cmd.dev);

  return tablemark(commands);
  // console.table(
  //   Object.fromEntries(
  //     commands.map(({ command, ...o }) => [command, o])
  //   )
  // );
}

function genConfigMd() {
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

/**
 * Steps:
 * 1. read `package.json` -> write `_dbux-code-commands.mdx`
 * 2. read `package.json` -> write `_dbux-code-config.mdx`
 */
function writeDbuxCodeMd() {
  const commandsMdPath = getDbuxPath('docs_site/content/partials/_dbux-code-commands.mdx');
  fs.writeFileSync(commandsMdPath, genCommandsMd());
  console.log(`Wrote ${commandsMdPath}`);

  const configMdPath = getDbuxPath('docs_site/content/partials/_dbux-code-config.mdx');
  fs.writeFileSync(configMdPath, genConfigMd());
  console.log(`Wrote ${configMdPath}`);
}

// module.exports = writeDbuxCodeMd;
// Object.assign(module.exports, {
//   genCommandsMd,
//   genConfigMd
// });

writeDbuxCodeMd();
