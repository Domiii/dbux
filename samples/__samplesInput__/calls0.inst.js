var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId3 = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tw = _dbux.traceWrite,
  _tc = _dbux.traceCallee,
  _tca = _dbux.traceCallArgument,
  _tcr = _dbux.traceCallResult;
try {
  var _t3_ = _td(3),
    _t4_ = _td(4),
    _t6_ = _td(6),
    _t8_ = _td(8);
  var _t11_,
    _t12_,
    _t13_,
    _t14_,
    _t15_,
    _t16_,
    _t17_,
    _t18_,
    _t19_,
    _t20_,
    _t21_,
    _t22_;
  _tcr(
    _tc(
      f,
      (_t11_ = _tid(11)),
      _t6_,
      null
    )(
      _tca(1, (_t12_ = _tid(12)), 0, null, _t11_),
      _tca(2, (_t13_ = _tid(13)), 0, null, _t11_)
    ),
    (_t14_ = _tid(14)),
    _t11_
  );

  var a = _tw(
      _te(1, (_t15_ = _tid(15)), 0, null),
      (_t16_ = _tid(16)),
      _t3_,
      [_t15_],
      0
    ),
    b = _tw(
      _te(2, (_t17_ = _tid(17)), 0, null),
      (_t18_ = _tid(18)),
      _t4_,
      [_t17_],
      0
    );
  _tcr(
    _tc(
      g,
      (_t19_ = _tid(19)),
      _t8_,
      null
    )(
      _tca(a, (_t20_ = _tid(20)), _t3_, null, _t19_),
      _tca(b, (_t21_ = _tid(21)), _t4_, null, _t19_)
    ),
    (_t22_ = _tid(22)),
    _t19_
  );

  function f() {
    // console.log('f');
    var _contextId = _pI(2, false);
    try {
      _dbux.t(30);
    } finally {
      _pF(_contextId);
    }
  }

  function g(a, b) {
    var _t9_ = _td(9),
      _t10_ = _td(10);
    var _contextId2 = _pI(3, false);
    try {
      var _t24_, _t25_, _t26_, _t27_, _t28_;
      _tcr(
        _tc(
          console.log,
          (_t24_ = _tid(24)),
          0,
          null
        )(
          _tca("g", (_t25_ = _tid(25)), 0, null, _t24_),
          _tca(a, (_t26_ = _tid(26)), 0, null, _t24_),
          _tca(b, (_t27_ = _tid(27)), 0, null, _t24_)
        ),
        (_t28_ = _tid(28)),
        _t24_
      );
      _dbux.t(31);
    } finally {
      _pF(_contextId2);
    }
  }
  _dbux.t(32);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "calls0.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\calls0.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 1 } },
          type: 1,
          name: "calls0.js",
          displayName: "calls0.js",
          fileName: "calls0.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\calls0.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 6, column: 0 }, end: { line: 8, column: 1 } },
          type: 2,
          name: "f",
          displayName: "f",
          isInterruptable: false,
        },
        {
          _staticId: 3,
          _parentId: 1,
          loc: { start: { line: 10, column: 0 }, end: { line: 12, column: 1 } },
          type: 2,
          name: "g",
          displayName: "g",
          isInterruptable: false,
        },
      ],
      traces: [
        {
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
          _traceId: 1,
          _staticContextId: 1,
          type: 1,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 3, column: 4 },
            end: { line: 3, column: 5 },
            identifierName: "a",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 3, column: 11 },
            end: { line: 3, column: 12 },
            identifierName: "b",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 11,
        },
        {
          loc: { start: { line: 6, column: 13 }, end: { line: 6, column: 14 } },
          _traceId: 5,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 6, column: 9 },
            end: { line: 6, column: 10 },
            identifierName: "f",
          },
          _traceId: 6,
          _staticContextId: 2,
          type: 11,
        },
        {
          loc: {
            start: { line: 10, column: 17 },
            end: { line: 10, column: 18 },
          },
          _traceId: 7,
          _staticContextId: 3,
          type: 1,
        },
        {
          displayName: "g",
          loc: {
            start: { line: 10, column: 9 },
            end: { line: 10, column: 10 },
            identifierName: "g",
          },
          _traceId: 8,
          _staticContextId: 3,
          type: 11,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 10, column: 11 },
            end: { line: 10, column: 12 },
            identifierName: "a",
          },
          _traceId: 9,
          _staticContextId: 3,
          type: 11,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 10, column: 14 },
            end: { line: 10, column: 15 },
            identifierName: "b",
          },
          _traceId: 10,
          _staticContextId: 3,
          type: 11,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 1 },
            identifierName: "f",
          },
          _traceId: 11,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "1",
          loc: { start: { line: 1, column: 2 }, end: { line: 1, column: 3 } },
          _traceId: 12,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "2",
          loc: { start: { line: 1, column: 5 }, end: { line: 1, column: 6 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "f(1, 2)",
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 7 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 3, column: 8 }, end: { line: 3, column: 9 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "a = 1",
          loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 9 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "2",
          loc: { start: { line: 3, column: 15 }, end: { line: 3, column: 16 } },
          _traceId: 17,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "b = 2",
          loc: { start: { line: 3, column: 11 }, end: { line: 3, column: 16 } },
          _traceId: 18,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "g",
          loc: {
            start: { line: 4, column: 0 },
            end: { line: 4, column: 1 },
            identifierName: "g",
          },
          _traceId: 19,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 4, column: 2 },
            end: { line: 4, column: 3 },
            identifierName: "a",
          },
          _traceId: 20,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 4, column: 5 },
            end: { line: 4, column: 6 },
            identifierName: "b",
          },
          _traceId: 21,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 7 } },
          _traceId: 22,
          _staticContextId: 1,
          type: 6,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 23,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "console.log",
          loc: {
            start: { line: 11, column: 2 },
            end: { line: 11, column: 13 },
          },
          _traceId: 24,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "'g'",
          loc: {
            start: { line: 11, column: 14 },
            end: { line: 11, column: 17 },
          },
          _traceId: 25,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 11, column: 19 },
            end: { line: 11, column: 20 },
            identifierName: "a",
          },
          _traceId: 26,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 11, column: 22 },
            end: { line: 11, column: 23 },
            identifierName: "b",
          },
          _traceId: 27,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "console.log('g', a, b)",
          loc: {
            start: { line: 11, column: 2 },
            end: { line: 11, column: 24 },
          },
          _traceId: 28,
          _staticContextId: 3,
          type: 6,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 29,
          _staticContextId: 3,
          type: 2,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 30,
          _staticContextId: 2,
          type: 22,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 31,
          _staticContextId: 3,
          type: 22,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 32,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsImEiLCJiIiwiZyIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiI0Z0JBQUEsU0FBQUEsQ0FBQywrQkFBRCxNQUFFLENBQUYsMENBQUssQ0FBTDs7QUFFQSxNQUFJQyxDQUFDLFdBQUcsQ0FBSCxpRUFBTCxDQUFXQyxDQUFDLFdBQUcsQ0FBSCxpRUFBWjtBQUNBLFdBQUFDLENBQUMsK0JBQUQsTUFBRUYsQ0FBRiw2Q0FBS0MsQ0FBTDs7QUFFQSxXQUFTRixDQUFULEdBQWE7QUFDWDtBQURXLG9EQUVaLENBRlksMkJBRVo7O0FBRUQsV0FBU0csQ0FBVCxDQUFXRixDQUFYLEVBQWNDLENBQWQsRUFBaUI7QUFDZixlQUFBRSxPQUFPLENBQUNDLEdBQVIsa0NBQVksR0FBWiwwQ0FBaUJKLENBQWpCLDBDQUFvQkMsQ0FBcEIsK0RBRGU7QUFFaEIsS0FGZ0IsNEJBRWhCLEMiLCJzb3VyY2VzQ29udGVudCI6WyJmKDEsIDIpO1xyXG5cclxudmFyIGEgPSAxLCBiID0gMjtcclxuZyhhLCBiKTtcclxuXHJcbmZ1bmN0aW9uIGYoKSB7XHJcbiAgLy8gY29uc29sZS5sb2coJ2YnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZyhhLCBiKSB7XHJcbiAgY29uc29sZS5sb2coJ2cnLCBhLCBiKTtcclxufSJdfQ==

