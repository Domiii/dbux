var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
try {
  var f = function (x) {
    var _contextId2 = _dbux.pushImmediate(2, 4, false);
    try {
      console.log("f", x);
      // throw new Error();
      _dbux.t(6);
    } finally {
      _dbux.popFunction(_contextId2, 5);
    }
  };
  f(1);
  console.log(f.toString());
  _dbux.t(3);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 6, column: 26 } },
          type: 1,
          name: "__unnamed_script_1.js",
          displayName: "__unnamed_script_1.js",
          fileName: "__unnamed_script_1.js",
          filePath: "__unnamed_script_1.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 1, column: 8 }, end: { line: 4, column: 1 } },
          type: 2,
          name: "f",
          displayName: "f",
          isInterruptable: false,
        },
      ],
      traces: [
        {
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          _callId: false,
          _traceId: 1,
          _staticContextId: 1,
          type: 1,
        },
        {
          loc: { start: { line: 6, column: 26 }, end: { line: 6, column: 26 } },
          _callId: false,
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 6, column: 25 }, end: { line: 6, column: 26 } },
          _callId: false,
          _traceId: 3,
          _staticContextId: 1,
          type: 22,
        },
        {
          loc: { start: { line: 1, column: 20 }, end: { line: 1, column: 21 } },
          _callId: false,
          _traceId: 4,
          _staticContextId: 2,
          type: 1,
        },
        {
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 1 } },
          _callId: false,
          _traceId: 5,
          _staticContextId: 2,
          type: 2,
        },
        {
          loc: { start: { line: 4, column: 0 }, end: { line: 4, column: 1 } },
          _callId: false,
          _traceId: 6,
          _staticContextId: 2,
          type: 22,
        },
      ],
      varAccess: [],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsIngiLCJjb25zb2xlIiwibG9nIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiJnTEFBQSxJQUFJQSxDQUFDLEdBQUcsVUFBU0MsQ0FBVCxFQUFZO0FBQ2xCQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxHQUFaLEVBQWlCRixDQUFqQjtBQUNBO0FBRmtCLGlCQUduQixDQUhtQiw2Q0FHbkIsQ0FIRDtBQUlBRCxFQUFBQSxDQUFDLENBQUMsQ0FBRCxDQUFEO0FBQ0FFLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSCxDQUFDLENBQUNJLFFBQUYsRUFBWixFIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGYgPSBmdW5jdGlvbih4KSB7XHJcbiAgY29uc29sZS5sb2coJ2YnLCB4KTtcclxuICAvLyB0aHJvdyBuZXcgRXJyb3IoKTtcclxufVxyXG5mKDEpO1xyXG5jb25zb2xlLmxvZyhmLnRvU3RyaW5nKCkpOyJdfQ==

