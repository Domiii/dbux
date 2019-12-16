"use strict";

const _dbuxRuntime = require('dbux-runtime');

const _dbux = _dbux_init(_dbuxRuntime);

try {
  /* #################################################################################### */
  function f1() {
    const _contextId2 = _dbux.pushImmediate(2);

    try {} finally {
      _dbux.popImmediate(_contextId2);
    }
  }

  function f2() {
    const _contextId3 = _dbux.pushImmediate(3);

    try {
      f1();
      f1();
    } finally {
      _dbux.popImmediate(_contextId3);
    }
  }

  f2();
} finally {
  _dbux.popProgram(_contextId);
}

function _dbux_init() {
  return _dbuxRuntime.initProgram({
    "filename": "src/__tests__/__samplesInput__/executionContextSimple.js",
    "staticSites": [{
      "staticId": 1,
      "type": 1,
      "name": "src/__tests__/__samplesInput__/executionContextSimple.js"
    }, {
      "staticId": 2,
      "type": 2,
      "name": "f1",
      "line": 2,
      "parent": 1
    }, {
      "staticId": 3,
      "type": 2,
      "name": "f2",
      "line": 6,
      "parent": 1
    }]
  });
}