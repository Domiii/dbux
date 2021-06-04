var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId3 = _dbux.getProgramContextId();
var _al = _dbux.getArgLength,
  _af = _dbux.arrayFrom,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _tp = _dbux.traceParam,
  _tid = _dbux.newTraceId,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tw = _dbux.traceWrite,
  _bce = _dbux.traceBCE,
  _tcr = _dbux.traceCallResult,
  _tme = _dbux.traceMemberExpression,
  _twme = _dbux.traceWriteMemberExpression;
try {
  var _t3_ = _td(3),
    _t4_ = _td(4),
    _t6_ = _td(6),
    _t8_ = _td(8);
  var _t9_,
    _t10_,
    _t11_,
    _f,
    _args,
    _t12_,
    _t13_,
    _t14_,
    _t15_,
    _t16_,
    _f2,
    _args2,
    _t17_,
    _t19_,
    _t21_,
    _t22_,
    _t23_,
    _t24_,
    _t25_,
    _f3,
    _args3;
  (_f = _te(f, (_t9_ = _tid(9)), _t6_, null)),
    (_args = []),
    _bce((_t10_ = _tid(10)), [], []),
    _tcr(_f(), (_t11_ = _tid(11)), _t10_);
  (_f2 = _te(f, (_t12_ = _tid(12)), _t6_, null)),
    (_args2 = [
      _te(1, (_t13_ = _tid(13)), 0, null),
      _te(2, (_t14_ = _tid(14)), 0, null),
    ]),
    _bce((_t15_ = _tid(15)), [_t13_, _t14_], []),
    _tcr(_f2(_args2[0], _args2[1]), (_t16_ = _tid(16)), _t15_);

  var a = _te(1, (_t17_ = _tid(17)), 0, null),
    b = _te(2, (_t19_ = _tid(19)), 0, null);
  (_f3 = _te(g, (_t21_ = _tid(21)), _t8_, null)),
    (_args3 = [
      _te(a, (_t22_ = _tid(22)), _t3_, null),
      _te(b, (_t23_ = _tid(23)), _t4_, null),
    ]),
    _bce((_t24_ = _tid(24)), [_t22_, _t23_], []),
    _tcr(_f3(_args3[0], _args3[1]), (_t25_ = _tid(25)), _t24_);

  function f(a, b) {
    var _contextId = _pI(2, 5, false);
    try {
      var _t26_, _t27_, _t28_, _t29_, _t30_, _t31_;
      return _te(
        _te(
          _te(1, (_t26_ = _tid(26)), 0, null) +
            _te(a, (_t27_ = _tid(27)), 0, null),
          (_t28_ = _tid(28)),
          0,
          [_t26_, _t27_]
        ) + _te(b, (_t29_ = _tid(29)), 0, null),
        (_t30_ = _tid(30)),
        0,
        [_t28_, _t29_]
      );
    } finally {
      _pF(_contextId, (_t31_ = _tid(31)));
    }
  }

  function g(a, b) {
    var _contextId2 = _pI(3, 7, false);
    try {
      var _t32_, _t33_, _t34_, _t35_;
      return _te(
        _te(a, (_t32_ = _tid(32)), 0, null) +
          _te(b, (_t33_ = _tid(33)), 0, null),
        (_t34_ = _tid(34)),
        0,
        [_t32_, _t33_]
      );
    } finally {
      _pF(_contextId2, (_t35_ = _tid(35)));
    }
  }
  _dbux.t(36);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 13, column: 1 } },
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
          loc: { start: { line: 7, column: 0 }, end: { line: 9, column: 1 } },
          type: 2,
          name: "f",
          displayName: "f",
          isInterruptable: false,
        },
        {
          _staticId: 3,
          _parentId: 1,
          loc: { start: { line: 11, column: 0 }, end: { line: 13, column: 1 } },
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
          loc: { start: { line: 13, column: 0 }, end: { line: 13, column: 1 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 4, column: 4 },
            end: { line: 4, column: 5 },
            identifierName: "a",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 31,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 4, column: 11 },
            end: { line: 4, column: 12 },
            identifierName: "b",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 31,
        },
        {
          loc: { start: { line: 7, column: 17 }, end: { line: 7, column: 18 } },
          _traceId: 5,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 7, column: 9 },
            end: { line: 7, column: 10 },
            identifierName: "f",
          },
          _traceId: 6,
          _staticContextId: 2,
          type: 31,
        },
        {
          loc: {
            start: { line: 11, column: 17 },
            end: { line: 11, column: 18 },
          },
          _traceId: 7,
          _staticContextId: 3,
          type: 1,
        },
        {
          displayName: "g",
          loc: {
            start: { line: 11, column: 9 },
            end: { line: 11, column: 10 },
            identifierName: "g",
          },
          _traceId: 8,
          _staticContextId: 3,
          type: 31,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 1 },
            identifierName: "f",
          },
          _traceId: 9,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "f()",
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 3 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "f()",
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 3 } },
          _traceId: 11,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 1 },
            identifierName: "f",
          },
          _traceId: 12,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "1",
          loc: { start: { line: 2, column: 2 }, end: { line: 2, column: 3 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "2",
          loc: { start: { line: 2, column: 5 }, end: { line: 2, column: 6 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "f(1, 2)",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 7 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "f(1, 2)",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 7 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 4, column: 8 }, end: { line: 4, column: 9 } },
          _traceId: 17,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "a = 1",
          loc: { start: { line: 4, column: 4 }, end: { line: 4, column: 9 } },
          _traceId: 18,
          _staticContextId: 1,
          type: 31,
        },
        {
          displayName: "2",
          loc: { start: { line: 4, column: 15 }, end: { line: 4, column: 16 } },
          _traceId: 19,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "b = 2",
          loc: { start: { line: 4, column: 11 }, end: { line: 4, column: 16 } },
          _traceId: 20,
          _staticContextId: 1,
          type: 31,
        },
        {
          displayName: "g",
          loc: {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 1 },
            identifierName: "g",
          },
          _traceId: 21,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 5, column: 2 },
            end: { line: 5, column: 3 },
            identifierName: "a",
          },
          _traceId: 22,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 5, column: 5 },
            end: { line: 5, column: 6 },
            identifierName: "b",
          },
          _traceId: 23,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 7 } },
          _traceId: 24,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 7 } },
          _traceId: 25,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 10 } },
          _traceId: 26,
          _staticContextId: 2,
          type: 33,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 8, column: 13 },
            end: { line: 8, column: 14 },
            identifierName: "a",
          },
          _traceId: 27,
          _staticContextId: 2,
          type: 32,
        },
        {
          displayName: "1 + a",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 14 } },
          _traceId: 28,
          _staticContextId: 2,
          type: 7,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 8, column: 17 },
            end: { line: 8, column: 18 },
            identifierName: "b",
          },
          _traceId: 29,
          _staticContextId: 2,
          type: 32,
        },
        {
          displayName: "1 + a + b",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 18 } },
          _traceId: 30,
          _staticContextId: 2,
          type: 7,
        },
        {
          loc: { start: { line: 9, column: 1 }, end: { line: 9, column: 1 } },
          _traceId: 31,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 12, column: 9 },
            end: { line: 12, column: 10 },
            identifierName: "a",
          },
          _traceId: 32,
          _staticContextId: 3,
          type: 32,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 12, column: 13 },
            end: { line: 12, column: 14 },
            identifierName: "b",
          },
          _traceId: 33,
          _staticContextId: 3,
          type: 32,
        },
        {
          displayName: "a + b",
          loc: {
            start: { line: 12, column: 9 },
            end: { line: 12, column: 14 },
          },
          _traceId: 34,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: { start: { line: 13, column: 1 }, end: { line: 13, column: 1 } },
          _traceId: 35,
          _staticContextId: 3,
          type: 2,
        },
        {
          loc: { start: { line: 13, column: 0 }, end: { line: 13, column: 1 } },
          _traceId: 36,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsImEiLCJiIiwiZyJdLCJtYXBwaW5ncyI6InNyQkFBQSxTQUFBQSxDQUFDLDZCQUFEO0FBQ0EsWUFBQUEsQ0FBQywrQkFBRCxnQkFBRSxDQUFGLGtDQUFLLENBQUw7O0FBRUEsTUFBSUMsQ0FBQyxPQUFHLENBQUgsNEJBQUwsQ0FBV0MsQ0FBQyxPQUFHLENBQUgsNEJBQVo7QUFDQSxZQUFBQyxDQUFDLCtCQUFELGdCQUFFRixDQUFGLHFDQUFLQyxDQUFMOztBQUVBLFdBQVNGLENBQVQsQ0FBV0MsQ0FBWCxFQUFjQyxDQUFkLHlDQUFpQjtBQUNmLGlCQUFPLDRDQUFJRCxDQUFKLHlFQUFRQyxDQUFSLDRCQUFQO0FBQ0QsS0FGRDs7QUFJQSxXQUFTQyxDQUFULENBQVdGLENBQVgsRUFBY0MsQ0FBZCwwQ0FBaUI7QUFDZixpQkFBTyxJQUFBRCxDQUFDLDRCQUFELE9BQUlDLENBQUosNEJBQVA7QUFDRCxLQUZELCtDIiwic291cmNlc0NvbnRlbnQiOlsiZigpO1xyXG5mKDEsIDIpO1xyXG5cclxudmFyIGEgPSAxLCBiID0gMjtcclxuZyhhLCBiKTtcclxuXHJcbmZ1bmN0aW9uIGYoYSwgYikge1xyXG4gIHJldHVybiAxICsgYSArIGI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGcoYSwgYikge1xyXG4gIHJldHVybiBhICsgYjtcclxufSJdfQ==

