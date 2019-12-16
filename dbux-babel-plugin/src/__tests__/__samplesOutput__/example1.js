"use strict";

const _dbuxRuntime = require('dbux-runtime');

const _dbux = _dbux_init(_dbuxRuntime);

try {
  /* #################################################################################### */
  function f1(x, y) {
    const _contextId2 = _dbux.pushImmediate(2);

    try {} finally {
      _dbux.popImmediate(_contextId2);
    }
  }

  class A {
    constructor() {
      const _contextId3 = _dbux.pushImmediate(3);

      try {
        this.m = new Map();
        this.s = new Set();
      } finally {
        _dbux.popImmediate(_contextId3);
      }
    }

    getX() {
      const _contextId4 = _dbux.pushImmediate(4);

      try {} finally {
        _dbux.popImmediate(_contextId4);
      }
    }

  }

  const f2 = (z, w) => {
    const _contextId5 = _dbux.pushImmediate(5);

    try {} finally {
      _dbux.popImmediate(_contextId5);
    }
  };

} finally {
  _dbux.popProgram(_contextId);
}
export { f1, A, f2 };

function _dbux_init() {
  return _dbuxRuntime.initProgram({
    "filename": "src/__tests__/__samplesInput__/example1.js",
    "staticSites": [{
      "staticId": 1,
      "type": 1,
      "name": "src/__tests__/__samplesInput__/example1.js"
    }, {
      "staticId": 2,
      "type": 2,
      "name": "f1",
      "line": 2,
      "parent": 1
    }, {
      "staticId": 3,
      "type": 2,
      "line": 6,
      "parent": 1
    }, {
      "staticId": 4,
      "type": 2,
      "line": 11,
      "parent": 1
    }, {
      "staticId": 5,
      "type": 2,
      "line": 14,
      "parent": 1
    }]
  });
}