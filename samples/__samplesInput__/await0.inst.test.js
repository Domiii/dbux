[90m[Dbux] linkOwnDependencies {"targetFolder":"/home/edison/Coding/dbux/dbux-cli","dependencyRoot":"/home/edison/Coding/dbux"}[39m
[DBUX module-alias] [
  '@babel/core -> /home/edison/Coding/dbux/node_modules/@babel/core',
  '@babel/plugin-proposal-class-properties -> /home/edison/Coding/dbux/node_modules/@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-decorators -> /home/edison/Coding/dbux/node_modules/@babel/plugin-proposal-decorators',
  '@babel/plugin-proposal-function-bind -> /home/edison/Coding/dbux/node_modules/@babel/plugin-proposal-function-bind',
  '@babel/plugin-proposal-optional-chaining -> /home/edison/Coding/dbux/node_modules/@babel/plugin-proposal-optional-chaining',
  '@babel/plugin-syntax-dynamic-import -> /home/edison/Coding/dbux/node_modules/@babel/plugin-syntax-dynamic-import',
  '@babel/plugin-syntax-export-default-from -> /home/edison/Coding/dbux/node_modules/@babel/plugin-syntax-export-default-from',
  '@babel/plugin-transform-runtime -> /home/edison/Coding/dbux/node_modules/@babel/plugin-transform-runtime',
  '@babel/preset-env -> /home/edison/Coding/dbux/node_modules/@babel/preset-env',
  '@babel/register -> /home/edison/Coding/dbux/node_modules/@babel/register',
  '@dbux/babel-plugin -> /home/edison/Coding/dbux/node_modules/@dbux/babel-plugin',
  '@dbux/common -> /home/edison/Coding/dbux/node_modules/@dbux/common',
  '@dbux/runtime -> /home/edison/Coding/dbux/node_modules/@dbux/runtime',
  'colors -> /home/edison/Coding/dbux/node_modules/colors',
  'i18next -> /home/edison/Coding/dbux/node_modules/i18next',
  'lodash -> /home/edison/Coding/dbux/node_modules/lodash',
  'module-alias -> /home/edison/Coding/dbux/node_modules/module-alias',
  'object.fromentries -> /home/edison/Coding/dbux/node_modules/object.fromentries',
  'prettier -> /home/edison/Coding/dbux/node_modules/prettier',
  'shelljs -> /home/edison/Coding/dbux/node_modules/shelljs',
  'yargs -> /home/edison/Coding/dbux/node_modules/yargs',
  '@dbux/cli -> /home/edison/Coding/dbux/node_modules/@dbux/cli'
]
// Instrumenting file /home/edison/Coding/dbux/samples/__samplesInput__/await0.js...
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
        _dbux.t(23),
        _dbux.traceCall(
          25,
          new _Promise(
            _dbux.traceArg(24, (r) => {
              var _contextId3 = _dbux.pushImmediate(4, 9, false);
              _dbux.traceExpr(11, r);
              try {
                var _setTimeout;
                return (
                  _dbux.traceExpr(12, (_setTimeout = setTimeout)),
                  _dbux.t(19),
                  _dbux.traceCall(
                    22,
                    _setTimeout(
                      _dbux.traceArg(20, () => {
                        var _contextId4 = _dbux.pushImmediate(5, 13, false);
                        try {
                          var _r;
                          return (
                            _dbux.traceExpr(15, (_r = r)),
                            _dbux.t(16),
                            _dbux.traceCall(18, _r(_dbux.traceArg(17, 13)))
                          );
                        } finally {
                          _dbux.popFunction(_contextId4, 14);
                        }
                      }),
                      _dbux.traceArg(21, ms)
                    )
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
    var _contextId5 = _dbux.pushImmediate(6, 26, true);
    _dbux.pushResume(7, 26);
    try {
      var _o, _func, _awaitArgument, _contextId6, _sleep, _o2, _func2;
      _dbux.traceExpr(29, (_o = console)),
        _dbux.traceExpr(30, (_func = _o.log)),
        _dbux.t(31),
        _dbux.traceCall(33, _func.call(_o, _dbux.traceArg(32, 1)));
      _dbux.postAwait(
        await _dbux.wrapAwait(
          (_awaitArgument =
            (_dbux.traceExpr(36, (_sleep = sleep)),
            _dbux.t(37),
            _dbux.traceCall(39, _sleep(_dbux.traceArg(38, 800))))),
          (_contextId6 = _dbux.preAwait(9, 34, _awaitArgument))
        ),
        _awaitArgument,
        _contextId6,
        35
      );
      _dbux.traceExpr(40, (_o2 = console)),
        _dbux.traceExpr(41, (_func2 = _o2.log)),
        _dbux.t(42),
        _dbux.traceCall(44, _func2.call(_o2, _dbux.traceArg(43, 2)));
      // await sleep(800);
      // console.log(3);
      // await sleep(800);
      // console.log(4);
      // await sleep(800);
      // console.log(5);
      _dbux.t(28);
    } finally {
      _dbux.popResume();
      _dbux.popFunction(_contextId5, 27);
    }
  }

  _dbux.traceExpr(45, (_main = main)),
    _dbux.t(46),
    _dbux.traceCall(47, _main());

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
          loc: { start: { line: 2, column: 22 }, end: { line: 2, column: 54 } },
          type: 2,
          displayName: "[cb] Promise",
          isInterruptable: false,
        },
        {
          _staticId: 5,
          _parentId: 4,
          loc: { start: { line: 2, column: 38 }, end: { line: 2, column: 49 } },
          type: 2,
          displayName: "[cb] setTimeout",
          isInterruptable: false,
        },
        {
          _staticId: 6,
          _parentId: 1,
          loc: { start: { line: 5, column: 0 }, end: { line: 15, column: 1 } },
          type: 2,
          name: "main",
          displayName: "main",
          isInterruptable: true,
        },
        {
          type: 4,
          _staticId: 7,
          _parentId: 6,
          loc: { start: { line: 5, column: 22 }, end: { line: 15, column: 1 } },
        },
        {
          type: 4,
          _staticId: 8,
          _parentId: 6,
          loc: { start: { line: 7, column: 18 }, end: { line: 15, column: 1 } },
        },
        {
          _staticId: 9,
          _parentId: 6,
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 18 } },
          type: 3,
          displayName: "(await sleep(800))",
          resumeId: 8,
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
          loc: { start: { line: 2, column: 54 }, end: { line: 2, column: 54 } },
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
          loc: { start: { line: 2, column: 44 }, end: { line: 2, column: 44 } },
          _callId: false,
          _traceId: 13,
          _staticContextId: 5,
          type: 1,
        },
        {
          loc: { start: { line: 2, column: 49 }, end: { line: 2, column: 49 } },
          _callId: false,
          _traceId: 14,
          _staticContextId: 5,
          type: 2,
        },
        {
          displayName: "r",
          loc: {
            start: { line: 2, column: 44 },
            end: { line: 2, column: 45 },
            identifierName: "r",
          },
          _callId: false,
          _traceId: 15,
          _staticContextId: 5,
          type: 8,
        },
        {
          displayName: "r(13)",
          loc: { start: { line: 2, column: 44 }, end: { line: 2, column: 49 } },
          _callId: 16,
          _traceId: 16,
          _staticContextId: 5,
          type: 4,
        },
        {
          displayName: "13",
          loc: { start: { line: 2, column: 46 }, end: { line: 2, column: 48 } },
          _callId: 16,
          _traceId: 17,
          _staticContextId: 5,
          type: 9,
        },
        {
          displayName: "r(13)",
          loc: { start: { line: 2, column: 44 }, end: { line: 2, column: 49 } },
          _callId: false,
          _resultCallId: 16,
          _traceId: 18,
          _staticContextId: 5,
          type: 16,
        },
        {
          displayName: "setTimeout(() => r(13), ms)",
          loc: { start: { line: 2, column: 27 }, end: { line: 2, column: 54 } },
          _callId: 19,
          _traceId: 19,
          _staticContextId: 4,
          type: 4,
        },
        {
          displayName: "[cb] setTimeout",
          loc: { start: { line: 2, column: 38 }, end: { line: 2, column: 49 } },
          _callId: 19,
          _traceId: 20,
          _staticContextId: 5,
          type: 9,
        },
        {
          displayName: "ms",
          loc: {
            start: { line: 2, column: 51 },
            end: { line: 2, column: 53 },
            identifierName: "ms",
          },
          _callId: 19,
          _traceId: 21,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "setTimeout(() => r(13), ms)",
          loc: { start: { line: 2, column: 27 }, end: { line: 2, column: 54 } },
          _callId: false,
          _resultCallId: 19,
          _traceId: 22,
          _staticContextId: 4,
          type: 16,
        },
        {
          displayName: "new Promise(r => setTimeout(() => r(13), ms))",
          loc: { start: { line: 2, column: 10 }, end: { line: 2, column: 55 } },
          _callId: 23,
          _traceId: 23,
          _staticContextId: 2,
          type: 4,
        },
        {
          displayName: "[cb] Promise",
          loc: { start: { line: 2, column: 22 }, end: { line: 2, column: 54 } },
          _callId: 23,
          _traceId: 24,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "new Promise(r => setTimeout(() => r(13), ms))",
          loc: { start: { line: 2, column: 10 }, end: { line: 2, column: 55 } },
          _callId: false,
          _resultCallId: 23,
          _traceId: 25,
          _staticContextId: 2,
          type: 16,
        },
        {
          loc: { start: { line: 5, column: 22 }, end: { line: 5, column: 23 } },
          _callId: false,
          _traceId: 26,
          _staticContextId: 6,
          type: 1,
        },
        {
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 1 } },
          _callId: false,
          _traceId: 27,
          _staticContextId: 6,
          type: 2,
        },
        {
          loc: { start: { line: 15, column: 0 }, end: { line: 15, column: 1 } },
          _callId: false,
          _traceId: 28,
          _staticContextId: 6,
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
          _traceId: 29,
          _staticContextId: 6,
          type: 8,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 13 } },
          _callId: false,
          _traceId: 30,
          _staticContextId: 6,
          type: 8,
        },
        {
          displayName: "console.log(1)",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 16 } },
          _callId: 31,
          _traceId: 31,
          _staticContextId: 6,
          type: 4,
        },
        {
          displayName: "1",
          loc: { start: { line: 6, column: 14 }, end: { line: 6, column: 15 } },
          _callId: 31,
          _traceId: 32,
          _staticContextId: 6,
          type: 9,
        },
        {
          displayName: "console.log(1)",
          loc: { start: { line: 6, column: 2 }, end: { line: 6, column: 16 } },
          _callId: false,
          _resultCallId: 31,
          _traceId: 33,
          _staticContextId: 6,
          type: 6,
        },
        {
          loc: { start: { line: 7, column: 18 }, end: { line: 7, column: 18 } },
          _callId: false,
          _traceId: 34,
          _staticContextId: 9,
          type: 20,
        },
        {
          displayName: "await sleep(800)",
          loc: { start: { line: 7, column: 2 }, end: { line: 7, column: 18 } },
          _callId: false,
          _traceId: 35,
          _staticContextId: 9,
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
          _traceId: 36,
          _staticContextId: 9,
          type: 8,
        },
        {
          displayName: "sleep(800)",
          loc: { start: { line: 7, column: 8 }, end: { line: 7, column: 18 } },
          _callId: 37,
          _traceId: 37,
          _staticContextId: 9,
          type: 4,
        },
        {
          displayName: "800",
          loc: { start: { line: 7, column: 14 }, end: { line: 7, column: 17 } },
          _callId: 37,
          _traceId: 38,
          _staticContextId: 9,
          type: 9,
        },
        {
          displayName: "sleep(800)",
          loc: { start: { line: 7, column: 8 }, end: { line: 7, column: 18 } },
          _callId: false,
          _resultCallId: 37,
          _traceId: 39,
          _staticContextId: 9,
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
          _traceId: 40,
          _staticContextId: 6,
          type: 8,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 13 } },
          _callId: false,
          _traceId: 41,
          _staticContextId: 6,
          type: 8,
        },
        {
          displayName: "console.log(2)",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 16 } },
          _callId: 42,
          _traceId: 42,
          _staticContextId: 6,
          type: 4,
        },
        {
          displayName: "2",
          loc: { start: { line: 8, column: 14 }, end: { line: 8, column: 15 } },
          _callId: 42,
          _traceId: 43,
          _staticContextId: 6,
          type: 9,
        },
        {
          displayName: "console.log(2)",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 16 } },
          _callId: false,
          _resultCallId: 42,
          _traceId: 44,
          _staticContextId: 6,
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
          _traceId: 45,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "main()",
          loc: { start: { line: 17, column: 0 }, end: { line: 17, column: 6 } },
          _callId: 46,
          _traceId: 46,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "main()",
          loc: { start: { line: 17, column: 0 }, end: { line: 17, column: 6 } },
          _callId: false,
          _resultCallId: 46,
          _traceId: 47,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsic2xlZXAiLCJtcyIsIlByb21pc2UiLCJyIiwic2V0VGltZW91dCIsIm1haW4iLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiMExBQUEsZUFBZUEsS0FBZixDQUFxQkMsRUFBckIsRUFBeUIsNkZBQUpBLEVBQUk7QUFDdEIsZ0NBQVdDLFdBQUFBLE9BQVgsb0NBQU8sZ0NBQVlDLENBQUMsSUFBSSx3RUFBTEEsQ0FBSyxnRUFBQUMsVUFBVSxvQ0FBViwrQkFBVyxNQUFNLGlHQUFBRCxDQUFDLG9DQUFELHNCQUFFLEVBQUYsRUFBQyxDQUFELGdEQUFLLENBQXRCLHNCQUF3QkYsRUFBeEIsRUFBVSxDQUFWLGdEQUEyQixDQUE1QyxFQUFQLEVBRHNCO0FBRXRCLEtBRnNCLCtEQUV0Qjs7QUFFSCxpQkFBZUksSUFBZixHQUFzQjtBQUNwQiwrQkFBQUMsT0FBTyx1QkFBUCxXQUFRQyxHQUFELG9DQUFQLGtDQUFZLENBQVosRUFBTyxDQUFQO0FBQ0Esa0ZBQU1QLFNBQUFBLEtBQU4sb0NBQU0sMEJBQU0sR0FBTixFQUFOO0FBQ0EsZ0NBQUFNLE9BQU8sdUJBQVAsYUFBUUMsR0FBRCxvQ0FBUCxvQ0FBWSxDQUFaLEVBQU8sQ0FBUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVRvQixrQkFVckIsQ0FWcUIsZ0VBVXJCOztBQUVELDhCQUFBRixJQUFJLG9DQUFKLE9BQUksQ0FBSjs7QUFFQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJhc3luYyBmdW5jdGlvbiBzbGVlcChtcykge1xuICAgcmV0dXJuIG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dCgoKSA9PiByKDEzKSwgbXMpKTsgXG4gIH1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgY29uc29sZS5sb2coMSk7XG4gIGF3YWl0IHNsZWVwKDgwMCk7XG4gIGNvbnNvbGUubG9nKDIpO1xuICAvLyBhd2FpdCBzbGVlcCg4MDApO1xuICAvLyBjb25zb2xlLmxvZygzKTtcbiAgLy8gYXdhaXQgc2xlZXAoODAwKTtcbiAgLy8gY29uc29sZS5sb2coNCk7XG4gIC8vIGF3YWl0IHNsZWVwKDgwMCk7XG4gIC8vIGNvbnNvbGUubG9nKDUpO1xufVxuXG5tYWluKCk7XG5cbi8vIHNldFRpbWVvdXQobWFpbiwgMTAwKTtcbi8vIHNldFRpbWVvdXQobWFpbiwgMjAwKTtcbi8vIHNldFRpbWVvdXQobWFpbiwgMzAwKTtcbiJdfQ==

