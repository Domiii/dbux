/**
 * @file
 * Sometimes things go wrong, and lerna does not clean up stuff 
 * from package.json files that it temporarily added while publishing.
 * 
 * see: https://github.com/lerna/lerna/issues/1880
 */
/* eslint no-console: 0 */

const fs = require('fs');
const path = require('path');

// make sure, we can import dbux stuff without any problems
require('../dbux-cli/lib/dbux-register-self');
require('../dbux-common/src/util/prettyLogs');

const {
  readPackageJson
} = require('../dbux-cli/lib/package-util');

function main() {
  const folder = fs.realpathSync('.');
  const pkg = readPackageJson(folder);
  if (pkg.gitHead) {
    const fpath = path.join(folder, 'package.json');
    console.debug(`Deleting gitHead from ${fpath}...`);
    delete pkg.gitHead;
    fs.writeFileSync(fpath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

main();