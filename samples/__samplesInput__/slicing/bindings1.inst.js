var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId;
var _te = _dbux.traceExpression;
var _tw = _dbux.traceWrite;
try {
  function f(x) {
    console.log(x);
  }

  // const x = 0;
  // f(x);
  const w = 6;

  for (var i = 0; i < 10; ++i) {
    const y = 4;
    setTimeout(() => {
      f(i, y);
      function g() {
        var x = 3;
        f(x, w);
        h();
      }
      g();
    }, 100);
  }
  for (let j = 0; j < 10; ++j) {
    setTimeout(() => f(j), 100);
  }

  function h() {}
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
          loc: { start: { line: 1, column: 0 }, end: { line: 27, column: 0 } },
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
          loc: { start: { line: 27, column: 0 }, end: { line: 27, column: 0 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 27, column: 0 }, end: { line: 27, column: 0 } },
          _traceId: 3,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiIsIngiLCJjb25zb2xlIiwibG9nIiwidyIsImkiLCJ5Iiwic2V0VGltZW91dCIsImciLCJoIiwiaiJdLCJtYXBwaW5ncyI6InVRQUFBLFNBQVNBLENBQVQsQ0FBV0MsQ0FBWCxFQUFjO0FBQ1pDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixDQUFaO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBLFFBQU1HLENBQUMsR0FBRyxDQUFWOztBQUVBLE9BQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxFQUFwQixFQUF3QixFQUFFQSxDQUExQixFQUE2QjtBQUMzQixVQUFNQyxDQUFDLEdBQUcsQ0FBVjtBQUNBQyxJQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNmUCxNQUFBQSxDQUFDLENBQUNLLENBQUQsRUFBSUMsQ0FBSixDQUFEO0FBQ0EsZUFBU0UsQ0FBVCxHQUFhO0FBQ1gsWUFBSVAsQ0FBQyxHQUFHLENBQVI7QUFDQUQsUUFBQUEsQ0FBQyxDQUFDQyxDQUFELEVBQUlHLENBQUosQ0FBRDtBQUNBSyxRQUFBQSxDQUFDO0FBQ0Y7QUFDREQsTUFBQUEsQ0FBQztBQUNGLEtBUlMsRUFRUCxHQVJPLENBQVY7QUFTRDtBQUNELE9BQUssSUFBSUUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxFQUFwQixFQUF3QixFQUFFQSxDQUExQixFQUE2QjtBQUMzQkgsSUFBQUEsVUFBVSxDQUFDLE1BQU1QLENBQUMsQ0FBQ1UsQ0FBRCxDQUFSLEVBQWEsR0FBYixDQUFWO0FBQ0Q7O0FBRUQsV0FBU0QsQ0FBVCxHQUFhLENBQUUsQyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGYoeCkge1xyXG4gIGNvbnNvbGUubG9nKHgpO1xyXG59XHJcblxyXG4vLyBjb25zdCB4ID0gMDtcclxuLy8gZih4KTtcclxuY29uc3QgdyA9IDY7XHJcblxyXG5mb3IgKHZhciBpID0gMDsgaSA8IDEwOyArK2kpIHtcclxuICBjb25zdCB5ID0gNDtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGYoaSwgeSk7XHJcbiAgICBmdW5jdGlvbiBnKCkge1xyXG4gICAgICB2YXIgeCA9IDM7XHJcbiAgICAgIGYoeCwgdyk7XHJcbiAgICAgIGgoKTtcclxuICAgIH1cclxuICAgIGcoKTtcclxuICB9LCAxMDApO1xyXG59XHJcbmZvciAobGV0IGogPSAwOyBqIDwgMTA7ICsraikge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4gZihqKSwgMTAwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaCgpIHt9XHJcblxyXG4iXX0=

