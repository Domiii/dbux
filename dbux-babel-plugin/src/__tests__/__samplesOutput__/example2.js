"use strict";

const _dbuxRuntime = require('dbux-runtime');

const _dbux = _dbux_init(_dbuxRuntime);

try {
  /* #################################################################################### */
  import { A } from './example1';

  (function main() {
    const _contextId2 = _dbux.pushImmediate(2);

    try {
      console.log(new A());
    } finally {
      _dbux.popImmediate(_contextId2);
    }
  })();
} finally {
  _dbux.popProgram(_contextId);
}

function _dbux_init() {
  return _dbuxRuntime.initProgram({
    "filename": "src/__tests__/__samplesInput__/example2.js",
    "staticSites": [{
      "staticId": 1,
      "type": 1,
      "name": "src/__tests__/__samplesInput__/example2.js"
    }, {
      "staticId": 2,
      "type": 2,
      "name": "main",
      "line": 4,
      "parent": 1
    }]
  });
}