var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId2 = _dbux.getProgramContextId();
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
  var _t4_ = _td(4);
  var _t10_, _t11_, _t12_;
  function f(x) {
    var _contextId = _pI(2, 3, false);
    try {
      var _t5_, _t6_, _t7_, _t8_, _t9_;
      _tcr(
        _tc(
          console.log,
          (_t5_ = _tid(5)),
          0,
          null
        )(
          _tca("f", (_t6_ = _tid(6)), 0, null, _t5_),
          _tca(x, (_t7_ = _tid(7)), 0, null, _t5_)
        ),
        (_t8_ = _tid(8)),
        _t5_
      );
      // throw new Error();
      debugger;
      _dbux.t(13);
    } finally {
      _pF(_contextId, (_t9_ = _tid(9)));
    }
  }
  _tcr(
    _tc(
      f,
      (_t10_ = _tid(10)),
      _t4_,
      null
    )(_tca(1, (_t11_ = _tid(11)), 0, null, _t10_)),
    (_t12_ = _tid(12)),
    _t10_
  );
  _dbux.t(14);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "functions0.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\functions0.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 5 } },
          type: 1,
          name: "functions0.js",
          displayName: "functions0.js",
          fileName: "functions0.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\functions0.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 4, column: 1 } },
          type: 2,
          name: "f",
          displayName: "f",
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
          loc: { start: { line: 5, column: 4 }, end: { line: 5, column: 5 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 1, column: 14 }, end: { line: 1, column: 15 } },
          _traceId: 3,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 1, column: 9 },
            end: { line: 1, column: 10 },
            identifierName: "f",
          },
          _traceId: 4,
          _staticContextId: 2,
          type: 11,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 2, column: 2 }, end: { line: 2, column: 13 } },
          _traceId: 5,
          _staticContextId: 2,
          type: 4,
        },
        {
          loc: { start: { line: 2, column: 17 }, end: { line: 2, column: 17 } },
          _traceId: 6,
          _staticContextId: 2,
          type: 15,
        },
        {
          loc: { start: { line: 2, column: 20 }, end: { line: 2, column: 20 } },
          _traceId: 7,
          _staticContextId: 2,
          type: 15,
        },
        {
          displayName: "console.log('f', x)",
          loc: { start: { line: 2, column: 2 }, end: { line: 2, column: 21 } },
          _traceId: 8,
          _staticContextId: 2,
          type: 6,
        },
        {
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 1 } },
          _traceId: 9,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 1 },
            identifierName: "f",
          },
          _traceId: 10,
          _staticContextId: 1,
          type: 4,
        },
        {
          loc: { start: { line: 5, column: 3 }, end: { line: 5, column: 3 } },
          _traceId: 11,
          _staticContextId: 1,
          type: 15,
        },
        {
          displayName: "f(1)",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 4 } },
          _traceId: 12,
          _staticContextId: 1,
          type: 6,
        },
        {
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 1 } },
          _traceId: 13,
          _staticContextId: 2,
          type: 22,
        },
        {
          loc: { start: { line: 5, column: 4 }, end: { line: 5, column: 5 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsIngiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoibWFBQUEsU0FBU0EsQ0FBVCxDQUFXQyxDQUFYLEVBQWM7QUFDWixlQUFBQyxPQUFPLENBQUNDLEdBQVIsZ0NBQVksR0FBWix1Q0FBaUJGLENBQWpCO0FBQ0E7QUFGWSxrQkFHYixDQUhhLDJDQUdiO0FBQ0QsV0FBQUQsQ0FBQywrQkFBRCxNQUFFLENBQUYsK0QiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBmKHgpIHtcclxuICBjb25zb2xlLmxvZygnZicsIHgpO1xyXG4gIC8vIHRocm93IG5ldyBFcnJvcigpO1xyXG59O1xyXG5mKDEpOyJdfQ==

