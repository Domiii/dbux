"use strict";

var _dbuxRuntime = require('dbux-runtime');

var _dbux = _dbux_init(_dbuxRuntime);

try {
  /* #################################################################################### */
  var f1 = function f1() {
    var _contextId = _dbux.pushImmediate(2);

    try {} finally {
      _dbux.popImmediate(_contextId);
    }
  };

  var f2 = function _f2() {
    var _contextId2 = _dbux.pushImmediate(3);

    try {} finally {
      _dbux.popImmediate(_contextId2);
    }
  };

  var f3 = function f3() {
    var _contextId3 = _dbux.pushImmediate(4);

    try {} finally {
      _dbux.popImmediate(_contextId3);
    }
  };

  var o = {
    f4: function f4() {
      var _contextId4 = _dbux.pushImmediate(5);

      try {} finally {
        _dbux.popImmediate(_contextId4);
      }
    },
    f5: function f5() {
      var _contextId5 = _dbux.pushImmediate(6);

      try {} finally {
        _dbux.popImmediate(_contextId5);
      }
    }
  };

  var C =
  /*#__PURE__*/
  function () {
    function C() {
      this.f7 = function () {
        var _contextId6 = _dbux.pushImmediate(7);

        try {} finally {
          _dbux.popImmediate(_contextId6);
        }
      };
    }

    var _proto = C.prototype;

    _proto.f6 = function f6() {
      var _contextId7 = _dbux.pushImmediate(8);

      try {} finally {
        _dbux.popImmediate(_contextId7);
      }
    };

    return C;
  }(); // // generator function
  // function *f8() {
  //   yield 1;
  //   yield 2;
  // }

} finally {
  _dbux.popProgram();
}

function _dbux_init() {
  return _dbuxRuntime.initProgram({
    "filename": "src\\__tests__\\__samplesInput__\\allFunctionTypes.js",
    "staticSites": [{
      "staticId": 1,
      "type": 1,
      "name": "src\\__tests__\\__samplesInput__\\allFunctionTypes.js"
    }, {
      "staticId": 2,
      "type": 2,
      "line": 2,
      "parent": 1
    }, {
      "staticId": 3,
      "type": 2,
      "name": "_f2",
      "line": 6,
      "parent": 1
    }, {
      "staticId": 4,
      "type": 2,
      "line": 10,
      "parent": 1
    }, {
      "staticId": 5,
      "type": 2,
      "name": "f4",
      "line": 15,
      "parent": 1
    }, {
      "staticId": 6,
      "type": 2,
      "name": "f5",
      "line": 16,
      "parent": 1
    }, {
      "staticId": 7,
      "type": 2,
      "line": 21,
      "parent": 1
    }, {
      "staticId": 8,
      "type": 2,
      "name": "f6",
      "line": 20,
      "parent": 1
    }]
  });
}