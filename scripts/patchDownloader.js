const path = require('path');
const fs = require('fs');
const sh = require('shelljs');
const open = require('open');
const isArray = require('lodash/isArray');
const LineReader = require('./LineReader');

// add babel-register, so we can import dbux src files
require('../dbux-cli/lib/dbux-register-self');

require('../dbux-common/src/util/prettyLogs');

const sleep = require('@dbux/common/src/util/sleep').default;

const DownloadRoot = path.join(__dirname, '../downloads');

function getDownloadDir(projectName) {
  return path.join(DownloadRoot, projectName);
}

const project1 = 'express';

async function downloadBugsJsProjectPatches(projectName, maxCommit = 30) {
  sh.mkdir('-p', getDownloadDir(projectName));
  for (let i = 1; i <= maxCommit; ++i) {
    await downloadBugsJsPatch(projectName, i, type);
    await sleep(3000);
  }
}

async function downloadBugsJsPatch(projectName, i, type) {
  // 1. get commit # of tag
  // 2. download patch file
  const tagName = `Bug-${i}-${type}`;
  const url = `https://github.com/BugsJS/${projectName}/commit/${commit}.patch`;

  const fpath = path.join(getDownloadDir(projectName), `${tagName}.patch`);
}