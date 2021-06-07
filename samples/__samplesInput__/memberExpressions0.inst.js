var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId = _dbux.getProgramContextId();
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
  _tmeo = _dbux.traceMemberExpressionOptional,
  _twme = _dbux.traceWriteMemberExpression;
try {
  var _console$log, _o, _t8_, _t9_, _t3_, _t4_, _t5_, _t6_, _t7_, _args;
  /**
   * Nested combinations involving all kinds of `MemberExpressions`
   */

  // const o = {
  //   b: {
  //     c: 3
  //   }
  // };

  // const x = o.b.c;
  // const y = o;

  (_o = _te(console, (_t8_ = _tid(8)), 0, null)),
    (_console$log = _tme(_o, "log", (_t9_ = _tid(9)), [_t8_])),
    (_args = [
      _tme(
        _tme(_te(o, (_t3_ = _tid(3)), 0, null), "b", (_t4_ = _tid(4)), [_t3_]),
        "c",
        (_t5_ = _tid(5)),
        [_t4_]
      ),
    ]),
    _bce((_t6_ = _tid(6)), [_t5_], []),
    _tcr(_console$log.call(_o, _args[0]), (_t7_ = _tid(7)), _t6_);
  _dbux.t(10);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "memberExpressions0.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\memberExpressions0.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 15, column: 0 } },
          type: 1,
          name: "memberExpressions0.js",
          displayName: "memberExpressions0.js",
          fileName: "memberExpressions0.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\memberExpressions0.js",
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
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 0 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 12 },
            end: { line: 14, column: 13 },
            identifierName: "o",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 12 },
            end: { line: 14, column: 15 },
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 35,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 12 },
            end: { line: 14, column: 17 },
          },
          _traceId: 5,
          _staticContextId: 1,
          type: 35,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 0 },
            end: { line: 14, column: 18 },
          },
          _traceId: 6,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 0 },
            end: { line: 14, column: 18 },
          },
          _traceId: 7,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 0 },
            end: { line: 14, column: 7 },
            identifierName: "console",
          },
          _traceId: 8,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "",
          loc: {
            start: { line: 14, column: 0 },
            end: { line: 14, column: 11 },
          },
          _traceId: 9,
          _staticContextId: 1,
          type: 35,
        },
        {
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 0 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiY29uc29sZSIsIm8iXSwibWFwcGluZ3MiOiI0bEJBQUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxXQUFBQSxPQUFPLDBCQUFQLGlGQUFZQyxDQUFaLHVMIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIE5lc3RlZCBjb21iaW5hdGlvbnMgaW52b2x2aW5nIGFsbCBraW5kcyBvZiBgTWVtYmVyRXhwcmVzc2lvbnNgXHJcbiAqL1xyXG5cclxuLy8gY29uc3QgbyA9IHtcclxuLy8gICBiOiB7XHJcbi8vICAgICBjOiAzXHJcbi8vICAgfVxyXG4vLyB9O1xyXG5cclxuLy8gY29uc3QgeCA9IG8uYi5jO1xyXG4vLyBjb25zdCB5ID0gbztcclxuXHJcbmNvbnNvbGUubG9nKG8uYi5jKTtcclxuIl19

