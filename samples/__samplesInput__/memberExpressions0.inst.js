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
  _tme = _dbux.traceMemberExpression,
  _tmeo = _dbux.traceMemberExpressionOptional,
  _twme = _dbux.traceWriteME,
  _bce = _dbux.traceBCE,
  _tcr = _dbux.traceCallResult;
try {
  var _t3_ = _td(3);
  var _console$log,
    _o,
    _t4_,
    _t5_,
    _t6_,
    _t7_,
    _t8_,
    _t9_,
    _t10_,
    _t11_,
    _t17_,
    _t18_,
    _t12_,
    _t13_,
    _t14_,
    _t15_,
    _t16_,
    _args;
  const o = _tw(
    _te({}, (_t4_ = _tid(4)), 0, []),
    (_t5_ = _tid(5)),
    _t3_,
    [_t4_],
    0
  );
  _twme(o, "b", _te({}, (_t6_ = _tid(6)), 0, []), (_t7_ = _tid(7)), [_t6_], 0);
  _twme(
    _tme(_te(o, (_t8_ = _tid(8)), _t3_, null), "b", (_t9_ = _tid(9)), [_t8_]),
    "c",
    _te(3, (_t10_ = _tid(10)), 0, null),
    (_t11_ = _tid(11)),
    _t9_,
    [_t10_],
    0
  );
  (_o = _te(console, (_t17_ = _tid(17)), 0, null)),
    (_console$log = _tme(_o, "log", (_t18_ = _tid(18)), [_t17_])),
    (_args = [
      _tme(
        _tme(_te(o, (_t12_ = _tid(12)), _t3_, null), "b", (_t13_ = _tid(13)), [
          _t12_,
        ]),
        "c",
        (_t14_ = _tid(14)),
        [_t13_]
      ),
    ]),
    _bce((_t15_ = _tid(15)), [_t14_], []),
    _tcr(_console$log.call(_o, _args[0]), (_t16_ = _tid(16)), _t15_);
  _dbux.t(19);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } },
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
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 0 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "",
          loc: {
            start: { line: 1, column: 6 },
            end: { line: 1, column: 7 },
            identifierName: "o",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 30,
        },
        {
          displayName: "",
          loc: { start: { line: 1, column: 10 }, end: { line: 1, column: 12 } },
          _traceId: 4,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "",
          loc: { start: { line: 1, column: 6 }, end: { line: 1, column: 12 } },
          _traceId: 5,
          _staticContextId: 1,
          type: 31,
        },
        {
          displayName: "",
          loc: { start: { line: 2, column: 6 }, end: { line: 2, column: 8 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 8 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "",
          loc: {
            start: { line: 3, column: 0 },
            end: { line: 3, column: 1 },
            identifierName: "o",
          },
          _traceId: 8,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "",
          loc: { start: { line: 3, column: 0 }, end: { line: 3, column: 3 } },
          _traceId: 9,
          _staticContextId: 1,
          type: 36,
        },
        {
          displayName: "",
          loc: { start: { line: 3, column: 8 }, end: { line: 3, column: 9 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 34,
        },
        {
          displayName: "",
          loc: { start: { line: 3, column: 0 }, end: { line: 3, column: 9 } },
          _traceId: 11,
          _staticContextId: 1,
          type: 32,
        },
        {
          displayName: "",
          loc: {
            start: { line: 4, column: 12 },
            end: { line: 4, column: 13 },
            identifierName: "o",
          },
          _traceId: 12,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "",
          loc: { start: { line: 4, column: 12 }, end: { line: 4, column: 15 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 36,
        },
        {
          displayName: "",
          loc: { start: { line: 4, column: 12 }, end: { line: 4, column: 17 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 36,
        },
        {
          displayName: "",
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 18 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "",
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 18 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "",
          loc: {
            start: { line: 4, column: 0 },
            end: { line: 4, column: 7 },
            identifierName: "console",
          },
          _traceId: 17,
          _staticContextId: 1,
          type: 33,
        },
        {
          displayName: "",
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 11 } },
          _traceId: 18,
          _staticContextId: 1,
          type: 36,
        },
        {
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 0 } },
          _traceId: 19,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsibyIsImNvbnNvbGUiXSwibWFwcGluZ3MiOiJ3cEJBQUEsTUFBTUEsQ0FBQyxXQUFHLEVBQUgsMERBQVA7QUFDQSxRQUFBQSxDQUFDLFdBQUssRUFBTCxvREFBRDtBQUNBLGlCQUFBQSxDQUFDLDZCQUFELHlDQUFRLENBQVI7QUFDQSxXQUFBQyxPQUFPLDRCQUFQLG9GQUFZRCxDQUFaLHdNIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbyA9IHt9O1xyXG5vLmIgPSB7fTtcclxuby5iLmMgPSAzO1xyXG5jb25zb2xlLmxvZyhvLmIuYyk7XHJcbiJdfQ==

