var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId2 = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _td = _dbux.traceDeclaration;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
var _tc = _dbux.traceCallee;
var _tca = _dbux.traceCallArgument;
var _tcr = _dbux.traceCallResult;
try {
  // f(1, 2);

  // var a = 1, b = 2;
  // g(a, b);

  function f() {
    // console.log('f');
    _td((_t4_ = _tid(4)));
    var _t4_;
    var _contextId = _dbux.pushImmediate(2, 3, false);
    try {
      _dbux.t(6);
    } finally {
      _dbux.popFunction(_contextId, 5);
    }
  }

  // function g(a, b) {
  //   console.log('g', a, b);
  // }
  _dbux.t(7);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 4 } },
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
      ],
      traces: [
        {
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
          _traceId: 1,
          _staticContextId: 1,
          type: 1,
        },
        {
          loc: { start: { line: 12, column: 3 }, end: { line: 12, column: 4 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 6, column: 13 }, end: { line: 6, column: 14 } },
          _traceId: 3,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "f",
          loc: {
            start: { line: 6, column: 9 },
            end: { line: 6, column: 10 },
            identifierName: "f",
          },
          _traceId: 4,
          _staticContextId: 2,
          type: 11,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 5,
          _staticContextId: 2,
          type: 2,
        },
        {
          loc: { start: { line: 8, column: 0 }, end: { line: 8, column: 1 } },
          _traceId: 6,
          _staticContextId: 2,
          type: 22,
        },
        {
          loc: { start: { line: 12, column: 3 }, end: { line: 12, column: 4 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiJdLCJtYXBwaW5ncyI6IitWQUFBOztBQUVBO0FBQ0E7O0FBRUEsV0FBU0EsQ0FBVCxHQUFhO0FBQ1g7QUFEVyxtR0FFWixDQUZZLDRDQUVaOztBQUVEO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIGYoMSwgMik7XHJcblxyXG4vLyB2YXIgYSA9IDEsIGIgPSAyO1xyXG4vLyBnKGEsIGIpO1xyXG5cclxuZnVuY3Rpb24gZigpIHtcclxuICAvLyBjb25zb2xlLmxvZygnZicpO1xyXG59XHJcblxyXG4vLyBmdW5jdGlvbiBnKGEsIGIpIHtcclxuLy8gICBjb25zb2xlLmxvZygnZycsIGEsIGIpO1xyXG4vLyB9Il19

