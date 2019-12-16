"use strict";

const _dbuxRuntime = require('dbux-runtime');

const _dbux = _dbux_init(_dbuxRuntime);

try {
  /* #################################################################################### */
  async function af1() {
    const _contextId2 = _dbux.pushImmediate(2);

    try {
      return Promise.resolve(1);
    } finally {
      _dbux.popImmediate(_contextId2);
    }
  }

  async function af2() {
    const _contextId3 = _dbux.pushImmediate(3);

    try {
      await af1();
      await af1();
      return 2 + af1();
    } finally {
      _dbux.popImmediate(_contextId3);
    }
  }

  async function af33(delay) {
    const _contextId4 = _dbux.pushImmediate(4);

    try {
      return new Promise(r => {
        const _contextId5 = _dbux.pushImmediate(5);

        try {
          setTimeout(r.bind(33), delay);
        } finally {
          _dbux.popImmediate(_contextId5);
        }
      });
    } finally {
      _dbux.popImmediate(_contextId4);
    }
  }

  async function af44() {
    const _contextId6 = _dbux.pushImmediate(6);

    try {
      const a = await af33(100);
      const b = await af33(50);
      return a + b + af33(10);
    } finally {
      _dbux.popImmediate(_contextId6);
    }
  }

  (async function main() {
    const _contextId7 = _dbux.pushImmediate(7);

    try {
      return Promise.all([af2(), af44()]);
    } finally {
      _dbux.popImmediate(_contextId7);
    }
  })();
} finally {
  _dbux.popProgram(_contextId);
}

function _dbux_init() {
  return _dbuxRuntime.initProgram({
    "filename": "src/__tests__/__samplesInput__/executionContextAsync.js",
    "staticSites": [{
      "staticId": 1,
      "type": 1,
      "name": "src/__tests__/__samplesInput__/executionContextAsync.js"
    }, {
      "staticId": 2,
      "type": 2,
      "name": "af1",
      "line": 2,
      "parent": 1
    }, {
      "staticId": 3,
      "type": 2,
      "name": "af2",
      "line": 6,
      "parent": 1
    }, {
      "staticId": 4,
      "type": 2,
      "name": "af33",
      "line": 13,
      "parent": 1
    }, {
      "staticId": 5,
      "type": 2,
      "line": 14,
      "parent": 4
    }, {
      "staticId": 6,
      "type": 2,
      "name": "af44",
      "line": 19,
      "parent": 1
    }, {
      "staticId": 7,
      "type": 2,
      "name": "main",
      "line": 26,
      "parent": 1
    }]
  });
}