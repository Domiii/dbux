var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
try {
  var _main;
  async function sleep(ms) {
    var _contextId2 = _dbux.pushImmediate(2, 4, true);
    _dbux.pushResume(3, 4);
    _dbux.traceExpr(6, ms);
    try {
      var _Promise;
      return (
        _dbux.traceExpr(8, (_Promise = Promise)),
        _dbux.t(17),
        _dbux.traceExpr(
          19,
          new _Promise(
            _dbux.traceArg(18, (r) => {
              var _contextId3 = _dbux.pushImmediate(4, 9, false);
              _dbux.traceExpr(11, r);
              try {
                var _setTimeout;
                return (
                  _dbux.traceExpr(12, (_setTimeout = setTimeout)),
                  _dbux.t(13),
                  _dbux.traceExpr(
                    16,
                    _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
                  )
                );
              } finally {
                _dbux.popFunction(_contextId3, 10);
              }
            })
          )
        )
      );
      _dbux.t(7);
    } finally {
      _dbux.popResume();
      _dbux.popFunction(_contextId2, 5);
    }
  }

  async function main() {
    var _contextId4 = _dbux.pushImmediate(5, 20, true);
    _dbux.pushResume(6, 20);
    try {
      var _o, _func, _contextId5, _sleep, _o2, _func2;
      _dbux.traceExpr(23, (_o = console)),
        _dbux.traceExpr(24, (_func = _o.log)),
        _dbux.t(25),
        _dbux.traceExpr(27, _func.call(_o, _dbux.traceArg(26, 1)));
      _dbux.postAwait(
        await _dbux.wrapAwait(
          (_dbux.traceExpr(30, (_sleep = sleep)),
          _dbux.t(31),
          _dbux.traceExpr(33, _sleep(_dbux.traceArg(32, 800)))),
          (_contextId5 = _dbux.preAwait(8, 28))
        ),
        _contextId5,
        29
      );
      _dbux.traceExpr(34, (_o2 = console)),
        _dbux.traceExpr(35, (_func2 = _o2.log)),
        _dbux.t(36),
        _dbux.traceExpr(38, _func2.call(_o2, _dbux.traceArg(37, 2)));
      // await sleep(800);
      // console.log(3);
      // await sleep(800);
      // console.log(4);
      // await sleep(800);
      // console.log(5);
      _dbux.t(22);
    } finally {
      _dbux.popResume();
      _dbux.popFunction(_contextId4, 21);
    }
  }

  _dbux.traceExpr(39, (_main = main)),
    _dbux.t(40),
    _dbux.traceExpr(41, _main());

  // setTimeout(main, 100);
  // setTimeout(main, 200);
  // setTimeout(main, 300);
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
          loc: { start: { line: 1, column: 0 }, end: { line: 22, column: 0 } },
          type: 1,
          name: "__unnamed_script_1.js",
          displayName: "__unnamed_script_1.js",
          fileName: "__unnamed_script_1.js",
          filePath: "__unnamed_script_1.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 3 } },
          type: 2,
          name: "sleep",
          displayName: "sleep",
          isInterruptable: true,
        },
        {
          type: 4,
          _staticId: 3,
          _parentId: 2,
          loc: { start: { line: 1, column: 25 }, end: { line: 3, column: 3 } },
        },
        {
          _staticId: 4,
          _parentId: 2,
          loc: { start: { line: 2, column: 22 }, end: { line: 2, column: 44 } },
          type: 2,
          displayName: "[cb] Promise",
          isInterruptable: false,
        },
        {
          _staticId: 5,
          _parentId: 1,
          loc: { start: { line: 5, column: 0 }, end: { line: 15, column: 1 } },
          type: 2,
          name: "main",
          displayName: "main",
          isInterruptable: true,
        },
        {
          type: 4,
          _staticId: 6,
          _parentId: 5,
          loc: { start: { line: 5, column: 22 }, end: { line: 15, column: 1 } },
        },
        {
          type: 4,
          _staticId: 7,
          _parentId: 5,
          loc: { start: { line: 7, column: 18 }, end: { line: 15, column: 1 } },
        },
        {
          _staticId: 8,
          _parentId: 5,
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 18 } },
          type: 3,
          displayName: "(await sleep(800))",
          resumeId: 7,
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
          loc: { start: { line: 22, column: 0 }, end: { line: 22, column: 0 } },
          _callId: false,
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 22, column: 0 }, end: { line: 22, column: 0 } },
          _callId: false,
          _traceId: 3,
          _staticContextId: 1,
          type: 22,
        },
        {
          loc: { start: { line: 1, column: 25 }, end: { line: 1, column: 26 } },
          _callId: false,
          _traceId: 4,
          _staticContextId: 2,
          type: 1,
        },
        {
          loc: { start: { line: 3, column: 2 }, end: { line: 3, column: 3 } },
          _callId: false,
          _traceId: 5,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "ms",
          loc: {
            start: { line: 1, column: 21 },
            end: { line: 1, column: 23 },
            identifierName: "ms",
          },
          _callId: false,
          _traceId: 6,
          _staticContextId: 2,
          type: 7,
        },
        {
          loc: { start: { line: 3, column: 2 }, end: { line: 3, column: 3 } },
          _callId: false,
          _traceId: 7,
          _staticContextId: 2,
          type: 22,
        },
        {
          displayName: "Promise",
          loc: {
            start: { line: 2, column: 14 },
            end: { line: 2, column: 21 },
            identifierName: "Promise",
          },
          _callId: false,
          _traceId: 8,
          _staticContextId: 2,
          type: 8,
        },
        {
          loc: { start: { line: 2, column: 27 }, end: { line: 2, column: 27 } },
          _callId: false,
          _traceId: 9,
          _staticContextId: 4,
          type: 1,
        },
        {
          loc: { start: { line: 2, column: 44 }, end: { line: 2, column: 44 } },
          _callId: false,
          _traceId: 10,
          _staticContextId: 4,
          type: 2,
        },
        {
          displayName: "r",
          loc: {
            start: { line: 2, column: 22 },
            end: { line: 2, column: 23 },
            identifierName: "r",
          },
          _callId: false,
          _traceId: 11,
          _staticContextId: 4,
          type: 7,
        },
        {
          displayName: "setTimeout",
          loc: {
            start: { line: 2, column: 27 },
            end: { line: 2, column: 37 },
            identifierName: "setTimeout",
          },
          _callId: false,
          _traceId: 12,
          _staticContextId: 4,
          type: 8,
        },
        {
          displayName: "setTimeout(r, ms)",
          loc: { start: { line: 2, column: 27 }, end: { line: 2, column: 44 } },
          _callId: 13,
          _traceId: 13,
          _staticContextId: 4,
          type: 4,
        },
        {
          displayName: "r",
          loc: {
            start: { line: 2, column: 38 },
            end: { line: 2, column: 39 },
            identifierName: "r",
          },
          _callId: 13,
          _traceId: 14,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "ms",
          loc: {
            start: { line: 2, column: 41 },
            end: { line: 2, column: 43 },
            identifierName: "ms",
          },
          _callId: 13,
          _traceId: 15,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "setTimeout(r, ms)",
          loc: { start: { line: 2, column: 27 }, end: { line: 2, column: 44 } },
          _callId: false,
          _resultCallId: 13,
          _traceId: 16,
          _staticContextId: 4,
          type: 16,
        },
        {
          displayName: "new Promise(r => setTimeout(r, ms))",
          loc: { start: { line: 2, column: 10 }, end: { line: 2, column: 45 } },
          _callId: 17,
          _traceId: 17,
          _staticContextId: 2,
          type: 4,
        },
        {
          displayName: "[cb] Promise",
          loc: { start: { line: 2, column: 22 }, end: { line: 2, column: 44 } },
          _callId: 17,
          _traceId: 18,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "new Promise(r => setTimeout(r, ms))",
          loc: { start: { line: 2, column: 10 }, end: { line: 2, column: 45 } },
          _callId: false,
          _resultCallId: 17,
          _traceId: 19,
          _staticContextId: 2,
          type: 16,
        },
        {
          loc: { start: { line: 5, column: 22 }, end: { line: 5, column: 23 } },
          _callId: false,
          _traceId: 20,
          _staticContextId: 5,
          type: 1,
        },
        {
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 1 } },
          _callId: false,
          _traceId: 21,
          _staticContextId: 5,
          type: 2,
        },
        {
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 1 } },
          _callId: false,
          _traceId: 22,
          _staticContextId: 5,
          type: 22,
        },
        {
          displayName: "console",
          loc: {
            start: { line: 6, column: 2 },
            end: { line: 6, column: 9 },
            identifierName: "console",
          },
          _callId: false,
          _traceId: 23,
          _staticContextId: 5,
          type: 8,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 13 } },
          _callId: false,
          _traceId: 24,
          _staticContextId: 5,
          type: 8,
        },
        {
          displayName: "console.log(1)",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 16 } },
          _callId: 25,
          _traceId: 25,
          _staticContextId: 5,
          type: 4,
        },
        {
          displayName: "1",
          loc: { start: { line: 6, column: 14 }, end: { line: 6, column: 15 } },
          _callId: 25,
          _traceId: 26,
          _staticContextId: 5,
          type: 9,
        },
        {
          displayName: "console.log(1)",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 16 } },
          _callId: false,
          _resultCallId: 25,
          _traceId: 27,
          _staticContextId: 5,
          type: 6,
        },
        {
          loc: { start: { line: 7, column: 18 }, end: { line: 7, column: 18 } },
          _callId: false,
          _traceId: 28,
          _staticContextId: 8,
          type: 20,
        },
        {
          displayName: "await sleep(800)",
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 18 } },
          _callId: false,
          _traceId: 29,
          _staticContextId: 8,
          type: 21,
        },
        {
          displayName: "sleep",
          loc: {
            start: { line: 7, column: 8 },
            end: { line: 7, column: 13 },
            identifierName: "sleep",
          },
          _callId: false,
          _traceId: 30,
          _staticContextId: 8,
          type: 8,
        },
        {
          displayName: "sleep(800)",
          loc: { start: { line: 7, column: 8 }, end: { line: 7, column: 18 } },
          _callId: 31,
          _traceId: 31,
          _staticContextId: 8,
          type: 4,
        },
        {
          displayName: "800",
          loc: { start: { line: 7, column: 14 }, end: { line: 7, column: 17 } },
          _callId: 31,
          _traceId: 32,
          _staticContextId: 8,
          type: 9,
        },
        {
          displayName: "sleep(800)",
          loc: { start: { line: 7, column: 8 }, end: { line: 7, column: 18 } },
          _callId: false,
          _resultCallId: 31,
          _traceId: 33,
          _staticContextId: 8,
          type: 6,
        },
        {
          displayName: "console",
          loc: {
            start: { line: 8, column: 2 },
            end: { line: 8, column: 9 },
            identifierName: "console",
          },
          _callId: false,
          _traceId: 34,
          _staticContextId: 5,
          type: 8,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 13 } },
          _callId: false,
          _traceId: 35,
          _staticContextId: 5,
          type: 8,
        },
        {
          displayName: "console.log(2)",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 16 } },
          _callId: 36,
          _traceId: 36,
          _staticContextId: 5,
          type: 4,
        },
        {
          displayName: "2",
          loc: { start: { line: 8, column: 14 }, end: { line: 8, column: 15 } },
          _callId: 36,
          _traceId: 37,
          _staticContextId: 5,
          type: 9,
        },
        {
          displayName: "console.log(2)",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 16 } },
          _callId: false,
          _resultCallId: 36,
          _traceId: 38,
          _staticContextId: 5,
          type: 6,
        },
        {
          displayName: "main",
          loc: {
            start: { line: 17, column: 0 },
            end: { line: 17, column: 4 },
            identifierName: "main",
          },
          _callId: false,
          _traceId: 39,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "main()",
          loc: { start: { line: 17, column: 0 }, end: { line: 17, column: 6 } },
          _callId: 40,
          _traceId: 40,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "main()",
          loc: { start: { line: 17, column: 0 }, end: { line: 17, column: 6 } },
          _callId: false,
          _resultCallId: 40,
          _traceId: 41,
          _staticContextId: 1,
          type: 6,
        },
      ],
      varAccess: [
        {
          _varId: 1,
          _ownerId: 2,
          loc: {
            start: { line: 1, column: 21 },
            end: { line: 1, column: 23 },
            identifierName: "ms",
          },
          ownerType: 2,
          name: "ms",
        },
        {
          _varId: 2,
          _ownerId: 4,
          loc: {
            start: { line: 2, column: 22 },
            end: { line: 2, column: 23 },
            identifierName: "r",
          },
          ownerType: 2,
          name: "r",
        },
      ],
      loops: [],
    },
    undefined
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsic2xlZXAiLCJtcyIsIlByb21pc2UiLCJyIiwic2V0VGltZW91dCIsIm1haW4iLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiMExBQUEsZUFBZUEsS0FBZixDQUFxQkMsRUFBckIsRUFBeUIsNkZBQUpBLEVBQUk7QUFDdEIsZ0NBQVdDLFdBQUFBLE9BQVgsb0NBQU8sZ0NBQVlDLENBQUMsSUFBSSx3RUFBTEEsQ0FBSyxnRUFBQUMsVUFBVSxvQ0FBViwrQkFBV0QsQ0FBWCxzQkFBY0YsRUFBZCxFQUFVLENBQVYsZ0RBQWlCLENBQWxDLEVBQVAsRUFEc0I7QUFFdEIsS0FGc0IsK0RBRXRCOztBQUVILGlCQUFlSSxJQUFmLEdBQXNCO0FBQ3BCLCtCQUFBQyxPQUFPLHVCQUFQLFdBQVFDLEdBQUQsb0NBQVAsa0NBQVksQ0FBWixFQUFPLENBQVA7QUFDQSxpRUFBTVAsU0FBQUEsS0FBTixvQ0FBTSwwQkFBTSxHQUFOLEVBQU47QUFDQSxnQ0FBQU0sT0FBTyx1QkFBUCxhQUFRQyxHQUFELG9DQUFQLG9DQUFZLENBQVosRUFBTyxDQUFQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBVG9CLGtCQVVyQixDQVZxQixnRUFVckI7O0FBRUQsOEJBQUFGLElBQUksb0NBQUosT0FBSSxDQUFKOztBQUVBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jIGZ1bmN0aW9uIHNsZWVwKG1zKSB7XHJcbiAgIHJldHVybiBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgbXMpKTsgXHJcbiAgfVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcclxuICBjb25zb2xlLmxvZygxKTtcclxuICBhd2FpdCBzbGVlcCg4MDApO1xyXG4gIGNvbnNvbGUubG9nKDIpO1xyXG4gIC8vIGF3YWl0IHNsZWVwKDgwMCk7XHJcbiAgLy8gY29uc29sZS5sb2coMyk7XHJcbiAgLy8gYXdhaXQgc2xlZXAoODAwKTtcclxuICAvLyBjb25zb2xlLmxvZyg0KTtcclxuICAvLyBhd2FpdCBzbGVlcCg4MDApO1xyXG4gIC8vIGNvbnNvbGUubG9nKDUpO1xyXG59XHJcblxyXG5tYWluKCk7XHJcblxyXG4vLyBzZXRUaW1lb3V0KG1haW4sIDEwMCk7XHJcbi8vIHNldFRpbWVvdXQobWFpbiwgMjAwKTtcclxuLy8gc2V0VGltZW91dChtYWluLCAzMDApO1xyXG4iXX0=

