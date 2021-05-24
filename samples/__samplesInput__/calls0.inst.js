var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId3 = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _td = _dbux.traceDeclaration;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
var _tc = _dbux.traceCallee;
var _tca = _dbux.traceCallArgument;
var _tcr = _dbux.traceCallResult;
try {
  _td((_t8_ = _tid(8)));
  _td((_t5_ = _tid(5)));
  var _t3_,
    _t4_,
    _t6_,
    _t7_,
    _t9_,
    _t10_,
    _t11_,
    _t12_,
    _t13_,
    _t14_,
    _t5_,
    _t8_;
  _tcr(_tc(f, (_t3_ = _tid(3)), 0, null)(), (_t4_ = _tid(4)), 0, null, _t3_);

  var a = _tw(
      _te(1, (_t6_ = _tid(6)), 0, null),
      (_t7_ = _tid(7)),
      _t5_,
      [_t6_],
      0
    ),
    b = _tw(
      _te(2, (_t9_ = _tid(9)), 0, null),
      (_t10_ = _tid(10)),
      _t8_,
      [_t9_],
      0
    );
  _tcr(
    _tc(
      g,
      (_t11_ = _tid(11)),
      0,
      null
    )(
      _tca(a, (_t12_ = _tid(12)), _t5_, null, _t11_),
      _tca(b, (_t13_ = _tid(13)), _t8_, null, _t11_)
    ),
    (_t14_ = _tid(14)),
    0,
    null,
    _t11_
  );

  function f() {
    _td((_t20_ = _tid(20)));
    var _contextId = _dbux.pushImmediate(2, 15, false);
    try {
      var _t16_, _t17_, _t18_, _t20_;
      _tcr(
        _tc(
          console.log,
          (_t16_ = _tid(16)),
          0,
          null
        )(_tca("f", (_t17_ = _tid(17)), 0, null, _t16_)),
        (_t18_ = _tid(18)),
        0,
        null,
        _t16_
      );
      _dbux.t(29);
    } finally {
      _dbux.popFunction(_contextId, 19);
    }
  }

  function g(a, b) {
    _td((_t28_ = _tid(28)));
    var _contextId2 = _dbux.pushImmediate(3, 21, false);
    try {
      var _t22_, _t23_, _t24_, _t25_, _t26_, _t28_;
      _tcr(
        _tc(
          console.log,
          (_t22_ = _tid(22)),
          0,
          null
        )(
          _tca("g", (_t23_ = _tid(23)), 0, null, _t22_),
          _tca(a, (_t24_ = _tid(24)), 0, null, _t22_),
          _tca(b, (_t25_ = _tid(25)), 0, null, _t22_)
        ),
        (_t26_ = _tid(26)),
        0,
        null,
        _t22_
      );
      _dbux.t(30);
    } finally {
      _dbux.popFunction(_contextId2, 27);
    }
  }
  _dbux.t(31);
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
          displayName: "f",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 1 },
            identifierName: "f",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "f()",
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 3 } },
          _traceId: 4,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 3, column: 4 },
            end: { line: 3, column: 5 },
            identifierName: "a",
          },
          _traceId: 5,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "1",
          loc: { start: { line: 3, column: 8 }, end: { line: 3, column: 9 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "a = 1",
          loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 9 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 3, column: 11 },
            end: { line: 3, column: 12 },
            identifierName: "b",
          },
          _traceId: 8,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "2",
          loc: { start: { line: 3, column: 15 }, end: { line: 3, column: 16 } },
          _traceId: 9,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "b = 2",
          loc: { start: { line: 3, column: 11 }, end: { line: 3, column: 16 } },
          _traceId: 10,
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
          _traceId: 11,
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
          _traceId: 12,
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
          _traceId: 13,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "g(a, b)",
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 7 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 6,
        },
        {
          loc: { start: { line: 6, column: 13 }, end: { line: 6, column: 14 } },
          _traceId: 15,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 13 } },
          _traceId: 16,
          _staticContextId: 2,
          type: 4,
        },
        {
          displayName: "'f'",
          loc: { start: { line: 7, column: 14 }, end: { line: 7, column: 17 } },
          _traceId: 17,
          _staticContextId: 2,
          type: 4,
        },
        {
          displayName: "console.log('f')",
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 18 } },
          _traceId: 18,
          _staticContextId: 2,
          type: 6,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 19,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 6, column: 9 },
            end: { line: 6, column: 10 },
            identifierName: "f",
          },
          _traceId: 20,
          _staticContextId: 2,
          type: 11,
        },
        {
          loc: {
            start: { line: 10, column: 17 },
            end: { line: 10, column: 18 },
          },
          _traceId: 21,
          _staticContextId: 3,
          type: 1,
        },
        {
          displayName: "console.log",
          loc: {
            start: { line: 11, column: 2 },
            end: { line: 11, column: 13 },
          },
          _traceId: 22,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "'g'",
          loc: {
            start: { line: 11, column: 14 },
            end: { line: 11, column: 17 },
          },
          _traceId: 23,
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
          _traceId: 24,
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
          _traceId: 25,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "console.log('g', a, b)",
          loc: {
            start: { line: 11, column: 2 },
            end: { line: 11, column: 24 },
          },
          _traceId: 26,
          _staticContextId: 3,
          type: 6,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 27,
          _staticContextId: 3,
          type: 2,
        },
        {
          displayName: "g",
          loc: {
            start: { line: 10, column: 9 },
            end: { line: 10, column: 10 },
            identifierName: "g",
          },
          _traceId: 28,
          _staticContextId: 3,
          type: 11,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 29,
          _staticContextId: 2,
          type: 22,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 30,
          _staticContextId: 3,
          type: 22,
        },
        {
          loc: { start: { line: 12, column: 0 }, end: { line: 12, column: 1 } },
          _traceId: 31,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsImEiLCJiIiwiZyIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJ1ZEFBQSxTQUFBQSxDQUFDLDBCQUFEOztBQUVBLE1BQUlDLENBQUMsV0FBRyxDQUFILDREQUFMLENBQVdDLENBQUMsV0FBRyxDQUFILDhEQUFaO0FBQ0EsV0FBQUMsQ0FBQyw0QkFBRCxNQUFFRixDQUFGLDZDQUFLQyxDQUFMOztBQUVBLFdBQVNGLENBQVQsR0FBYTtBQUNYLGVBQUFJLE9BQU8sQ0FBQ0MsR0FBUixrQ0FBWSxHQUFaLHdFQURXO0FBRVosS0FGWSw2Q0FFWjs7QUFFRCxXQUFTRixDQUFULENBQVdGLENBQVgsRUFBY0MsQ0FBZCxFQUFpQjtBQUNmLGVBQUFFLE9BQU8sQ0FBQ0MsR0FBUixrQ0FBWSxHQUFaLDBDQUFpQkosQ0FBakIsMENBQW9CQyxDQUFwQix3RUFEZTtBQUVoQixLQUZnQiw4Q0FFaEIsQyIsInNvdXJjZXNDb250ZW50IjpbImYoKTtcclxuXHJcbnZhciBhID0gMSwgYiA9IDI7XHJcbmcoYSwgYik7XHJcblxyXG5mdW5jdGlvbiBmKCkge1xyXG4gIGNvbnNvbGUubG9nKCdmJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGcoYSwgYikge1xyXG4gIGNvbnNvbGUubG9nKCdnJywgYSwgYik7XHJcbn0iXX0=

