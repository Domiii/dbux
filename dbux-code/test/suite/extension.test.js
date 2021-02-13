const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
// const myExtension = require('../extension');

const testDir = path.join(__dirname, '../__data');

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  // see https://github.com/mochajs/mocha/issues/1762#issuecomment-439712156
  suiteSetup(() => {
    sh.mkdir(testDir);
  });

  test('sh.cp', () => {
    let fpath = path.join(testDir, 'testfile');
    let fpath2 = fpath + '2';
    fs.writeFileSync(fpath, 'good');
    fs.writeFileSync(fpath2, 'bad');
    fpath = fs.realpathSync(fpath);
    fpath2 = fs.realpathSync(fpath2);

    sh.cp('-R', fpath, fpath2);
    assert.strictEqual(fs.readFileSync(fpath2).toString(), 'good');
  });
});
