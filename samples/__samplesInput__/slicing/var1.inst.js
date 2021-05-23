var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _td = _dbux.traceDeclaration;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
try {
  _td((_t18_ = _tid(18)));
  _td((_t4_ = _tid(4)));
  _td((_t3_ = _tid(3)));
  var _t5_,
    _t6_,
    _t7_,
    _t8_,
    _t9_,
    _t10_,
    _t11_,
    _t12_,
    _t13_,
    _t14_,
    _t15_,
    _t16_,
    _t17_,
    _t19_,
    _t3_,
    _t4_,
    _t18_;
  let a,
    b = _tw(_te(0, (_t5_ = _tid(5)), 0, null), (_t6_ = _tid(6)), _t4_, 0, [
      _t5_,
    ]);
  _tw((a = _te(1, (_t7_ = _tid(7)), 0, null)), (_t8_ = _tid(8)), _t3_, 0, [
    _t7_,
  ]);
  _tw((b = _te(2, (_t9_ = _tid(9)), 0, null)), (_t10_ = _tid(10)), _t4_, 0, [
    _t9_,
  ]);

  _tw(
    (a = _te(
      _te(a, (_t11_ = _tid(11)), _t3_, null) +
        _te(b, (_t12_ = _tid(12)), _t4_, null),
      (_t13_ = _tid(13)),
      0,
      [_t11_, _t12_]
    )),
    (_t14_ = _tid(14)),
    _t3_,
    0,
    [_t13_]
  );

  const c = _tw(
    _te(
      _te(a, (_t15_ = _tid(15)), _t3_, null) +
        _te(b, (_t16_ = _tid(16)), _t4_, null),
      (_t17_ = _tid(17)),
      0,
      [_t15_, _t16_]
    ),
    (_t19_ = _tid(19)),
    _t18_,
    0,
    [_t17_]
  );
  _dbux.t(20);
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
          type: 11,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 1, column: 7 },
            end: { line: 1, column: 8 },
            identifierName: "b",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "0",
          loc: { start: { line: 1, column: 11 }, end: { line: 1, column: 12 } },
          _traceId: 5,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "b = 0",
          loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 12 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "1",
          loc: { start: { line: 2, column: 4 }, end: { line: 2, column: 5 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "a = 1",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 5 } },
          _traceId: 8,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "2",
          loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 5 } },
          _traceId: 9,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "b = 2",
          loc: { start: { line: 3, column: 0 }, end: { line: 3, column: 5 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 5, column: 4 },
            end: { line: 5, column: 5 },
            identifierName: "a",
          },
          _traceId: 11,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 5, column: 8 },
            end: { line: 5, column: 9 },
            identifierName: "b",
          },
          _traceId: 12,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 5, column: 4 }, end: { line: 5, column: 9 } },
          _traceId: 13,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "a = a + b",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 9 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 7, column: 10 },
            end: { line: 7, column: 11 },
            identifierName: "a",
          },
          _traceId: 15,
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
          _traceId: 16,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 7, column: 10 }, end: { line: 7, column: 15 } },
          _traceId: 17,
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
          _traceId: 18,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "c = a + b",
          loc: { start: { line: 7, column: 6 }, end: { line: 7, column: 15 } },
          _traceId: 19,
          _staticContextId: 1,
          type: 12,
        },
        {
          loc: { start: { line: 7, column: 15 }, end: { line: 7, column: 16 } },
          _traceId: 20,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiYSIsImIiLCJjIl0sIm1hcHBpbmdzIjoiK2FBQUEsSUFBSUEsQ0FBSixDQUFPQyxDQUFDLFdBQUcsQ0FBSCw0REFBUjtBQUNBLE1BQUFELENBQUMsT0FBRyxDQUFILDBCQUFEO0FBQ0EsTUFBQUMsQ0FBQyxPQUFHLENBQUgsMEJBQUQ7O0FBRUEsTUFBQUQsQ0FBQyxPQUFHLElBQUFBLENBQUMsK0JBQUQsT0FBSUMsQ0FBSiwrQkFBSCxzQ0FBRDs7QUFFQSxRQUFNQyxDQUFDLFdBQUcsSUFBQUYsQ0FBQywrQkFBRCxPQUFJQyxDQUFKLCtCQUFILDRFQUFQLEMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgYSwgYiA9IDA7XHJcbmEgPSAxO1xyXG5iID0gMjtcclxuXHJcbmEgPSBhICsgYlxyXG5cclxuY29uc3QgYyA9IGEgKyBiOyJdfQ==

