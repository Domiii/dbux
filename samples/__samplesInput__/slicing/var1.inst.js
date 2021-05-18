var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
try {
  var _t3_, _t4_, _t5_;
  let a, b;
  a = 1;
  b = 2;

  _te(
    _te(a, (_t3_ = _tid(3)), null, []) + _te(b, (_t4_ = _tid(4)), null, []),
    (_t5_ = _tid(5)),
    null,
    [_t3_, _t4_]
  );
  _dbux.t(6);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 6, column: 0 } },
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
          loc: { start: { line: 6, column: 0 }, end: { line: 6, column: 0 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "a",
          loc: {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 1 },
            identifierName: "a",
          },
          _traceId: 3,
          _staticContextId: 1,
        },
        {
          displayName: "b",
          loc: {
            start: { line: 5, column: 4 },
            end: { line: 5, column: 5 },
            identifierName: "b",
          },
          _traceId: 4,
          _staticContextId: 1,
        },
        {
          displayName: "a + b",
          loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 5 } },
          _traceId: 5,
          _staticContextId: 1,
          type: 7,
        },
        {
          loc: { start: { line: 6, column: 0 }, end: { line: 6, column: 0 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiYSIsImIiXSwibWFwcGluZ3MiOiI0UkFBQSxJQUFJQSxDQUFKLEVBQU9DLENBQVA7QUFDQUQsRUFBQUEsQ0FBQyxHQUFHLENBQUo7QUFDQUMsRUFBQUEsQ0FBQyxHQUFHLENBQUo7O0FBRUEsVUFBQUQsQ0FBQywyQkFBRCxPQUFJQyxDQUFKLGlFIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGEsIGI7XHJcbmEgPSAxO1xyXG5iID0gMjtcclxuXHJcbmEgKyBiXHJcbiJdfQ==

