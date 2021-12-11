const path = require('path');
const fs = require('fs');
const sh = require('shelljs');
// const { fetch, CookieJar } = require('node-fetch-cookies');
// const fetch = require('node-fetch');

const run = require('./run');

// add babel-register, so we can import dbux src files
require('./dbux-register-self');

require('../dbux-common/src/util/prettyLogs');
const sleep = require('../dbux-common/src/util/sleep').default;
const { fetchGET } = require('../dbux-projects/src/util/fetch.js');


const DownloadRoot = path.join(__dirname, '../downloads');

function getDownloadDir(projectName) {
  return path.join(DownloadRoot, projectName);
}


async function downloadBugsJsProjectPatches(projectName, maxBugNumber = 30) {
  sh.mkdir('-p', getDownloadDir(projectName));
  for (let i = 1; i <= maxBugNumber; ++i) {
    await downloadBugsJsPatch(projectName, i, 'test');
    await downloadBugsJsPatch(projectName, i, 'fix');
  }
}

// ode --stack-trace-limit=100 --enable-source-maps -- ./scripts/patchDownloader.js
async function downloadBugsJsPatch(projectName, i, type) {
  const cwd = path.join(__dirname, '../dbux_projects', projectName);

  // 1. get commit # of tag
  const tagName = `Bug-${i}-${type}`;
  const fpath = path.join(getDownloadDir(projectName), `${tagName}.patch`);

  if (fs.existsSync(fpath)) {
    // already have it -> skip
    console.debug(`Skipping "${tagName}."`);
    return;
  }
  const commit = run(`git rev-list -n 1 tags/${tagName}`, cwd);
  const url = `https://github.com/BugsJS/${projectName}/commit/${commit}.patch`;

  console.debug(`Downloading "${tagName}"...`);

  // 2. download patch
  const fetchOptions = {};
  await sleep(3000);
  const patchData = await fetchGET(url, null, fetchOptions, false, { raw: true });

  // 3. write to file
  if (patchData) {
    fs.writeFileSync(fpath, patchData);
    console.debug(`  -> saved in ${fpath} (${patchData.length} bytes)`);
  }
}

async function main() {
  await downloadBugsJsProjectPatches('eslint');
}

main();