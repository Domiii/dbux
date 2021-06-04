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
    _f2,
    _args2,
    _t15_,
    _t17_,
    _t19_,
    _t20_,
    _t21_,
    _f3,
    _args3;
  (_f = _te(f, (_t9_ = _tid(9)), _t6_, null)),
    (_args = []),
    _bce((_t10_ = _tid(10)), [], []),
    _te(_f(), (_t11_ = _tid(11)), _t10_);
  (_f2 = _te(f, (_t12_ = _tid(12)), _t6_, null)),
    (_args2 = []),
    _bce((_t13_ = _tid(13)), [], []),
    _te(_f2(), (_t14_ = _tid(14)), _t13_);

  var a = _te(1, (_t15_ = _tid(15)), 0, null),
    b = _te(2, (_t17_ = _tid(17)), 0, null);
  (_f3 = _te(g, (_t19_ = _tid(19)), _t8_, null)),
    (_args3 = []),
    _bce((_t20_ = _tid(20)), [], []),
    _te(_f3(), (_t21_ = _tid(21)), _t20_);

  function f(a, b) {
    var _contextId = _pI(2, 5, false);
    try {
      var _t22_, _t23_, _t24_, _t25_, _t26_, _t27_;
      return _te(
        _te(
          _te(1, (_t22_ = _tid(22)), 0, null) +
            _te(a, (_t23_ = _tid(23)), 0, null),
          (_t24_ = _tid(24)),
          0,
          [_t22_, _t23_]
        ) + _te(b, (_t25_ = _tid(25)), 0, null),
        (_t26_ = _tid(26)),
        0,
        [_t24_, _t25_]
      );
    } finally {
      _pF(_contextId, (_t27_ = _tid(27)));
    }
  }

  function g(a, b) {
    var _contextId2 = _pI(3, 7, false);
    try {
      var _t28_, _t29_, _t30_, _t31_;
      return _te(
        _te(a, (_t28_ = _tid(28)), 0, null) +
          _te(b, (_t29_ = _tid(29)), 0, null),
        (_t30_ = _tid(30)),
        0,
        [_t28_, _t29_]
      );
    } finally {
      _pF(_contextId2, (_t31_ = _tid(31)));
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
          displayName: "f(1, 2)",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 7 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "f(1, 2)",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 7 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 4, column: 8 }, end: { line: 4, column: 9 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "a = 1",
          loc: { start: { line: 4, column: 4 }, end: { line: 4, column: 9 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 31,
        },
        {
          displayName: "2",
          loc: { start: { line: 4, column: 15 }, end: { line: 4, column: 16 } },
          _traceId: 17,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "b = 2",
          loc: { start: { line: 4, column: 11 }, end: { line: 4, column: 16 } },
          _traceId: 18,
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
          _traceId: 19,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 7 } },
          _traceId: 20,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 7 } },
          _traceId: 21,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 10 } },
          _traceId: 22,
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
          _traceId: 23,
          _staticContextId: 2,
          type: 32,
        },
        {
          displayName: "1 + a",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 14 } },
          _traceId: 24,
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
          _traceId: 25,
          _staticContextId: 2,
          type: 32,
        },
        {
          displayName: "1 + a + b",
          loc: { start: { line: 8, column: 9 }, end: { line: 8, column: 18 } },
          _traceId: 26,
          _staticContextId: 2,
          type: 7,
        },
        {
          loc: { start: { line: 9, column: 1 }, end: { line: 9, column: 1 } },
          _traceId: 27,
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
          _traceId: 28,
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
          _traceId: 29,
          _staticContextId: 3,
          type: 32,
        },
        {
          displayName: "a + b",
          loc: {
            start: { line: 12, column: 9 },
            end: { line: 12, column: 14 },
          },
          _traceId: 30,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: { start: { line: 13, column: 1 }, end: { line: 13, column: 1 } },
          _traceId: 31,
          _staticContextId: 3,
          type: 2,
        },
        {
          loc: { start: { line: 13, column: 0 }, end: { line: 13, column: 1 } },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsImEiLCJiIiwiZyJdLCJtYXBwaW5ncyI6IjBwQkFBQSxTQUFBQSxDQUFDLDZCQUFEO0FBQ0EsWUFBQUEsQ0FBQywrQkFBRDs7QUFFQSxNQUFJQyxDQUFDLE9BQUcsQ0FBSCw0QkFBTCxDQUFXQyxDQUFDLE9BQUcsQ0FBSCw0QkFBWjtBQUNBLFlBQUFDLENBQUMsK0JBQUQ7O0FBRUEsV0FBU0gsQ0FBVCxDQUFXQyxDQUFYLEVBQWNDLENBQWQseUNBQWlCO0FBQ2YsaUJBQU8sNENBQUlELENBQUoseUVBQVFDLENBQVIsNEJBQVA7QUFDRCxLQUZEOztBQUlBLFdBQVNDLENBQVQsQ0FBV0YsQ0FBWCxFQUFjQyxDQUFkLDBDQUFpQjtBQUNmLGlCQUFPLElBQUFELENBQUMsNEJBQUQsT0FBSUMsQ0FBSiw0QkFBUDtBQUNELEtBRkQsK0MiLCJzb3VyY2VzQ29udGVudCI6WyJmKCk7XHJcbmYoMSwgMik7XHJcblxyXG52YXIgYSA9IDEsIGIgPSAyO1xyXG5nKGEsIGIpO1xyXG5cclxuZnVuY3Rpb24gZihhLCBiKSB7XHJcbiAgcmV0dXJuIDEgKyBhICsgYjtcclxufVxyXG5cclxuZnVuY3Rpb24gZyhhLCBiKSB7XHJcbiAgcmV0dXJuIGEgKyBiO1xyXG59Il19

