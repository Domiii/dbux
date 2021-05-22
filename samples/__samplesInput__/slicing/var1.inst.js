var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
try {
  _t14_ = _tid(14);
  _t5_ = _tid(5);
  _t3_ = _tid(3);
  var _t4_,
    _t6_,
    _t7_,
    _t8_,
    _t9_,
    _t10_,
    _t11_,
    _t12_,
    _t13_,
    _t15_,
    _t3_,
    _t5_,
    _t14_;
  let a = _tw(undefined, (_t4_ = _tid(4)), _t3_, 0, []),
    b = _tw(_te(0, (_t6_ = _tid(6)), 0, null), (_t7_ = _tid(7)), _t5_, 0, [
      _t6_,
    ]);
  a = 1;
  b = 2;

  _te(
    _te(a, (_t8_ = _tid(8)), _t3_, null) + _te(b, (_t9_ = _tid(9)), _t5_, null),
    (_t10_ = _tid(10)),
    0,
    [_t8_, _t9_]
  );

  const c = _tw(
    _te(
      _te(a, (_t11_ = _tid(11)), _t3_, null) +
        _te(b, (_t12_ = _tid(12)), _t5_, null),
      (_t13_ = _tid(13)),
      0,
      [_t11_, _t12_]
    ),
    (_t15_ = _tid(15)),
    _t14_,
    0,
    [_t13_]
  );
  _dbux.t(16);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "var1.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\slicing\\var1.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 7, column: 16 } },
          type: 1,
          name: "var1.js",
          displayName: "var1.js",
          fileName: "var1.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\slicing\\var1.js",
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
          loc: { start: { line: 7, column: 15 }, end: { line: 7, column: 16 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 1, column: 4 },
            end: { line: 1, column: 5 },
            identifierName: "a",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a",
          loc: { start: { line: 1, column: 4 }, end: { line: 1, column: 5 } },
          _traceId: 4,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 1, column: 7 },
            end: { line: 1, column: 8 },
            identifierName: "b",
          },
          _traceId: 5,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "0",
          loc: { start: { line: 1, column: 11 }, end: { line: 1, column: 12 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "b = 0",
          loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 12 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 1 },
            identifierName: "a",
          },
          _traceId: 8,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 5, column: 4 },
            end: { line: 5, column: 5 },
            identifierName: "b",
          },
          _traceId: 9,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 5 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 7, column: 10 },
            end: { line: 7, column: 11 },
            identifierName: "a",
          },
          _traceId: 11,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 7, column: 14 },
            end: { line: 7, column: 15 },
            identifierName: "b",
          },
          _traceId: 12,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 7, column: 10 }, end: { line: 7, column: 15 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "c",
          loc: {
            start: { line: 7, column: 6 },
            end: { line: 7, column: 7 },
            identifierName: "c",
          },
          _traceId: 14,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "c = a + b",
          loc: { start: { line: 7, column: 6 }, end: { line: 7, column: 15 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 12,
        },
        {
          loc: { start: { line: 7, column: 15 }, end: { line: 7, column: 16 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiYSIsImIiLCJjIl0sIm1hcHBpbmdzIjoiNllBQUEsSUFBSUEsQ0FBQyw4Q0FBTCxDQUFPQyxDQUFDLFdBQUcsQ0FBSCw0REFBUjtBQUNBRCxFQUFBQSxDQUFDLEdBQUcsQ0FBSjtBQUNBQyxFQUFBQSxDQUFDLEdBQUcsQ0FBSjs7QUFFQSxVQUFBRCxDQUFDLDZCQUFELE9BQUlDLENBQUo7O0FBRUEsUUFBTUMsQ0FBQyxXQUFHLElBQUFGLENBQUMsK0JBQUQsT0FBSUMsQ0FBSiwrQkFBSCw0RUFBUCxDIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGEsIGIgPSAwO1xyXG5hID0gMTtcclxuYiA9IDI7XHJcblxyXG5hICsgYlxyXG5cclxuY29uc3QgYyA9IGEgKyBiOyJdfQ==

