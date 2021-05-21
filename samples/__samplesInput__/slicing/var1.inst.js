var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
try {
  _t10_ = _tid(10);
  _t5_ = _tid(5);
  _t3_ = _tid(3);
  var _t4_,
    _t6_,
    _t7_,
    _t8_,
    _t9_,
    _t11_,
    _t12_,
    _t13_,
    _t14_,
    _t3_,
    _t5_,
    _t10_;
  let a = _tw(undefined, (_t4_ = _tid(4)), null),
    b = _tw(undefined, (_t6_ = _tid(6)), null);
  a = 1;
  b = 2;

  _te(
    _te(a, (_t7_ = _tid(7)), 0, null) + _te(b, (_t8_ = _tid(8)), 0, null),
    (_t9_ = _tid(9)),
    0,
    [_t7_, _t8_]
  );

  const c = _tw(
    _te(
      _te(a, (_t11_ = _tid(11)), 0, null) + _te(b, (_t12_ = _tid(12)), 0, null),
      (_t13_ = _tid(13)),
      0,
      [_t11_, _t12_]
    ),
    (_t14_ = _tid(14)),
    null
  );
  _dbux.t(15);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "__unnamed_script_1.js",
      filePath: "__unnamed_script_1.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 7, column: 16 } },
          type: 1,
          name: "__unnamed_script_1.js",
          displayName: "__unnamed_script_1.js",
          fileName: "__unnamed_script_1.js",
          filePath: "__unnamed_script_1.js",
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
          loc: { start: { line: 1, column: 4 }, end: { line: 1, column: 5 } },
          _traceId: 3,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 1, column: 4 },
            end: { line: 1, column: 5 },
            identifierName: "a",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "b",
          loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 8 } },
          _traceId: 5,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 1, column: 7 },
            end: { line: 1, column: 8 },
            identifierName: "b",
          },
          _traceId: 6,
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
          _traceId: 7,
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
          _traceId: 8,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 5 } },
          _traceId: 9,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "c = a + b",
          loc: { start: { line: 7, column: 6 }, end: { line: 7, column: 15 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 13,
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
          type: 12,
        },
        {
          loc: { start: { line: 7, column: 15 }, end: { line: 7, column: 16 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiYSIsImIiLCJjIl0sIm1hcHBpbmdzIjoic1lBQUEsSUFBSUEsQ0FBQyx1Q0FBTCxDQUFPQyxDQUFDLHVDQUFSO0FBQ0FELEVBQUFBLENBQUMsR0FBRyxDQUFKO0FBQ0FDLEVBQUFBLENBQUMsR0FBRyxDQUFKOztBQUVBLFVBQUFELENBQUMsMEJBQUQsT0FBSUMsQ0FBSjs7QUFFQSxRQUFNQyxDQUFDLFdBQUcsSUFBQUYsQ0FBQyw0QkFBRCxPQUFJQyxDQUFKLDRCQUFILCtEQUFQLEMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgYSwgYjtcclxuYSA9IDE7XHJcbmIgPSAyO1xyXG5cclxuYSArIGJcclxuXHJcbmNvbnN0IGMgPSBhICsgYjsiXX0=

