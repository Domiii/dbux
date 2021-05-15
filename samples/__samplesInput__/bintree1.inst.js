/*
node --stack-trace-limit=1000 --enable-source-maps "C:\Users\domin\code\dbux\node_modules\@dbux\cli\bin\dbux.js" run --esnext --d c:\Users\domin\code\dbux\samples\__samplesInput__\bintree1.inst.js
*/

"use strict";
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _isString2 = _interopRequireDefault(require("lodash/isString")); // import isString from '../node_modules/lodash/isString';
var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
console.error('_dbuxRuntime', Object.keys(_dbuxRuntime).join(','));
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
try {
  var _main;
  // https://leetcode.com/submissions/detail/258300839/
  // https://leetcode.com/problems/trim-a-binary-search-tree/

  function TreeNode(val) {
    var _contextId2 = _dbux.pushImmediate(2, 4, false);
    _dbux.traceExpr(6, val);
    try {
      _dbux.traceExpr(9, (_dbux.traceExpr(8, this).val = val));
      _dbux.traceExpr(
        13,
        (_dbux.traceExpr(10, this).left = _dbux.traceExpr(
          12,
          (_dbux.traceExpr(11, this).right = null)
        ))
      );
      _dbux.t(7);
    } finally {
      _dbux.popFunction(_contextId2, 5);
    }
  }

  /**
   * Takes (a string representation of or) a pre-order traversal array and returns a new tree for it.
   * You can find something similar on leetcode playground: https://leetcode.com/playground/new/binary-tree
   */
  function buildTree(input) {
    var _contextId3 = _dbux.pushImmediate(3, 14, false);
    _dbux.traceExpr(16, input);
    try {
      var _isString, _TreeNode;
      if (
        (_dbux.traceExpr(18, (_isString = _isString2.default)),
        _dbux.t(19),
        _dbux.traceExpr(21, _isString(_dbux.traceArg(20, input))))
      ) {
        {
          _dbux.t(28);
          {
            var _o, _func;
            _dbux.traceExpr(
              27,
              (input =
                (_dbux.traceExpr(22, (_o = JSON)),
                _dbux.traceExpr(23, (_func = _o.parse)),
                _dbux.t(24),
                _dbux.traceExpr(26, _func.call(_o, _dbux.traceArg(25, input)))))
            );
          }
        }
        _dbux.t(29);
      }
      const root =
        (_dbux.traceExpr(30, (_TreeNode = TreeNode)),
        _dbux.t(33),
        _dbux.traceExpr(
          35,
          new _TreeNode(
            _dbux.traceArg(
              34,
              _dbux.traceExpr(31, input)[_dbux.traceExpr(32, 0)]
            )
          )
        ));
      const nodeQueue = _dbux.traceExpr(36, [root]);
      let iInput = _dbux.traceExpr(37, 1);

      for (
        let iQueue = _dbux.traceExpr(38, 0);
        _dbux.traceExpr(40, iInput) <
        _dbux.traceExpr(41, _dbux.traceExpr(39, input).length);
        _dbux.traceExpr(42, ++iQueue)
      ) {
        const node = _dbux.traceExpr(
          45,
          _dbux.traceExpr(43, nodeQueue)[_dbux.traceExpr(44, iQueue)]
        );

        // left
        let val = _dbux.traceExpr(
          48,
          _dbux.traceExpr(47, input)[_dbux.traceExpr(46, iInput++)]
        );
        if (
          _dbux.traceExpr(
            61,
            _dbux.traceExpr(49, val) !== _dbux.traceExpr(50, null)
          )
        ) {
          {
            _dbux.t(62);
            {
              var _o2, _func2, _TreeNode2;
              _dbux.traceExpr(51, (_o2 = nodeQueue)),
                _dbux.traceExpr(52, (_func2 = _o2.push)),
                _dbux.t(59),
                _dbux.traceExpr(
                  60,
                  _func2.call(
                    _o2,
                    _dbux.traceExpr(
                      58,
                      (_dbux.traceExpr(53, node).left =
                        (_dbux.traceExpr(54, (_TreeNode2 = TreeNode)),
                        _dbux.t(55),
                        _dbux.traceExpr(
                          57,
                          new _TreeNode2(_dbux.traceArg(56, val))
                        )))
                    )
                  )
                );
            }
          }
          _dbux.t(63);
        }

        if (
          _dbux.traceExpr(
            68,
            _dbux.traceExpr(65, iInput) >=
              _dbux.traceExpr(66, _dbux.traceExpr(64, input).length)
          )
        ) {
          {
            _dbux.t(69);
            {
              _dbux.t(67);
              break;
            }
          }
          _dbux.t(70);
        }

        // right
        _dbux.traceExpr(
          73,
          (val = _dbux.traceExpr(72, input)[_dbux.traceExpr(71, iInput++)])
        );
        if (
          _dbux.traceExpr(
            86,
            _dbux.traceExpr(74, val) !== _dbux.traceExpr(75, null)
          )
        ) {
          {
            _dbux.t(87);
            {
              var _o3, _func3, _TreeNode3;
              _dbux.traceExpr(76, (_o3 = nodeQueue)),
                _dbux.traceExpr(77, (_func3 = _o3.push)),
                _dbux.t(84),
                _dbux.traceExpr(
                  85,
                  _func3.call(
                    _o3,
                    _dbux.traceExpr(
                      83,
                      (_dbux.traceExpr(78, node).right =
                        (_dbux.traceExpr(79, (_TreeNode3 = TreeNode)),
                        _dbux.t(80),
                        _dbux.traceExpr(
                          82,
                          new _TreeNode3(_dbux.traceArg(81, val))
                        )))
                    )
                  )
                );
            }
          }
          _dbux.t(88);
        }
      }
      return _dbux.traceExpr(89, root);
      _dbux.t(17);
    } finally {
      _dbux.popFunction(_contextId3, 15);
    }
  }

  function main() {
    var _contextId4 = _dbux.pushImmediate(4, 90, false);
    try {
      var _buildTree;
      _dbux.traceExpr(93, (_buildTree = buildTree)),
        _dbux.t(94),
        _dbux.traceExpr(
          96,
          _buildTree(_dbux.traceArg(95, [1, null, 3, 2, 4, null, 5, 6]))
        );
      _dbux.t(92);
    } finally {
      _dbux.popFunction(_contextId4, 91);
    }
  }

  _dbux.traceExpr(97, (_main = main)),
    _dbux.t(98),
    _dbux.traceExpr(99, _main());
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
          loc: { start: { line: 1, column: 0 }, end: { line: 51, column: 0 } },
          type: 1,
          name: "__unnamed_script_1.js",
          displayName: "__unnamed_script_1.js",
          fileName: "__unnamed_script_1.js",
          filePath: "__unnamed_script_1.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 7, column: 0 }, end: { line: 10, column: 1 } },
          type: 2,
          name: "TreeNode",
          displayName: "TreeNode",
          isInterruptable: false,
        },
        {
          _staticId: 3,
          _parentId: 1,
          loc: { start: { line: 16, column: 0 }, end: { line: 44, column: 1 } },
          type: 2,
          name: "buildTree",
          displayName: "buildTree",
          isInterruptable: false,
        },
        {
          _staticId: 4,
          _parentId: 1,
          loc: { start: { line: 46, column: 0 }, end: { line: 48, column: 1 } },
          type: 2,
          name: "main",
          displayName: "main",
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
          loc: { start: { line: 51, column: 0 }, end: { line: 51, column: 0 } },
          _callId: false,
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 51, column: 0 }, end: { line: 51, column: 0 } },
          _callId: false,
          _traceId: 3,
          _staticContextId: 1,
          type: 23,
        },
        {
          loc: { start: { line: 7, column: 23 }, end: { line: 7, column: 24 } },
          _callId: false,
          _traceId: 4,
          _staticContextId: 2,
          type: 1,
        },
        {
          loc: { start: { line: 10, column: 0 }, end: { line: 10, column: 1 } },
          _callId: false,
          _traceId: 5,
          _staticContextId: 2,
          type: 2,
        },
        {
          displayName: "val",
          loc: {
            start: { line: 7, column: 18 },
            end: { line: 7, column: 21 },
            identifierName: "val",
          },
          _callId: false,
          _traceId: 6,
          _staticContextId: 2,
          type: 11,
        },
        {
          loc: { start: { line: 10, column: 0 }, end: { line: 10, column: 1 } },
          _callId: false,
          _traceId: 7,
          _staticContextId: 2,
          type: 23,
        },
        {
          displayName: "this",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 6 } },
          _callId: false,
          _traceId: 8,
          _staticContextId: 2,
          type: 8,
        },
        {
          displayName: "this.val = val",
          loc: { start: { line: 8, column: 2 }, end: { line: 8, column: 16 } },
          _callId: false,
          _traceId: 9,
          _staticContextId: 2,
          type: 7,
        },
        {
          displayName: "this",
          loc: { start: { line: 9, column: 2 }, end: { line: 9, column: 6 } },
          _callId: false,
          _traceId: 10,
          _staticContextId: 2,
          type: 8,
        },
        {
          displayName: "this",
          loc: { start: { line: 9, column: 14 }, end: { line: 9, column: 18 } },
          _callId: false,
          _traceId: 11,
          _staticContextId: 2,
          type: 8,
        },
        {
          displayName: "this.right = null",
          loc: { start: { line: 9, column: 14 }, end: { line: 9, column: 31 } },
          _callId: false,
          _traceId: 12,
          _staticContextId: 2,
          type: 7,
        },
        {
          displayName: "this.left = this.right = null",
          loc: { start: { line: 9, column: 2 }, end: { line: 9, column: 31 } },
          _callId: false,
          _traceId: 13,
          _staticContextId: 2,
          type: 7,
        },
        {
          loc: {
            start: { line: 16, column: 26 },
            end: { line: 16, column: 27 },
          },
          _callId: false,
          _traceId: 14,
          _staticContextId: 3,
          type: 1,
        },
        {
          loc: { start: { line: 44, column: 0 }, end: { line: 44, column: 1 } },
          _callId: false,
          _traceId: 15,
          _staticContextId: 3,
          type: 2,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 16, column: 19 },
            end: { line: 16, column: 24 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 16,
          _staticContextId: 3,
          type: 11,
        },
        {
          loc: { start: { line: 44, column: 0 }, end: { line: 44, column: 1 } },
          _callId: false,
          _traceId: 17,
          _staticContextId: 3,
          type: 23,
        },
        {
          displayName: "isString",
          loc: {
            start: { line: 17, column: 6 },
            end: { line: 17, column: 14 },
            identifierName: "isString",
          },
          _callId: false,
          _traceId: 18,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "isString(input)",
          loc: {
            start: { line: 17, column: 6 },
            end: { line: 17, column: 21 },
          },
          _callId: 19,
          _traceId: 19,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 17, column: 15 },
            end: { line: 17, column: 20 },
            identifierName: "input",
          },
          _callId: 19,
          _traceId: 20,
          _staticContextId: 3,
          type: 9,
        },
        {
          displayName: "isString(input)",
          loc: {
            start: { line: 17, column: 6 },
            end: { line: 17, column: 21 },
          },
          _callId: false,
          _resultCallId: 19,
          _traceId: 21,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "JSON",
          loc: {
            start: { line: 18, column: 12 },
            end: { line: 18, column: 16 },
            identifierName: "JSON",
          },
          _callId: false,
          _traceId: 22,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "JSON.parse",
          loc: {
            start: { line: 18, column: 12 },
            end: { line: 18, column: 22 },
          },
          _callId: false,
          _traceId: 23,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "JSON.parse(input)",
          loc: {
            start: { line: 18, column: 12 },
            end: { line: 18, column: 29 },
          },
          _callId: 24,
          _traceId: 24,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 18, column: 23 },
            end: { line: 18, column: 28 },
            identifierName: "input",
          },
          _callId: 24,
          _traceId: 25,
          _staticContextId: 3,
          type: 9,
        },
        {
          displayName: "JSON.parse(input)",
          loc: {
            start: { line: 18, column: 12 },
            end: { line: 18, column: 29 },
          },
          _callId: false,
          _resultCallId: 24,
          _traceId: 26,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "input = JSON.parse(input)",
          loc: {
            start: { line: 18, column: 4 },
            end: { line: 18, column: 29 },
          },
          _callId: false,
          _traceId: 27,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: {
            start: { line: 17, column: 23 },
            end: { line: 17, column: 24 },
          },
          _callId: false,
          _traceId: 28,
          _staticContextId: 3,
          type: 15,
        },
        {
          loc: { start: { line: 19, column: 2 }, end: { line: 19, column: 3 } },
          _callId: false,
          _traceId: 29,
          _staticContextId: 3,
          type: 16,
        },
        {
          displayName: "TreeNode",
          loc: {
            start: { line: 20, column: 19 },
            end: { line: 20, column: 27 },
            identifierName: "TreeNode",
          },
          _callId: false,
          _traceId: 30,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 20, column: 28 },
            end: { line: 20, column: 33 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 31,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "0",
          loc: {
            start: { line: 20, column: 34 },
            end: { line: 20, column: 35 },
          },
          _callId: false,
          _traceId: 32,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "new TreeNode(input[0])",
          loc: {
            start: { line: 20, column: 15 },
            end: { line: 20, column: 37 },
          },
          _callId: 33,
          _traceId: 33,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "input[0]",
          loc: {
            start: { line: 20, column: 28 },
            end: { line: 20, column: 36 },
          },
          _callId: 33,
          _traceId: 34,
          _staticContextId: 3,
          type: 9,
        },
        {
          displayName: "new TreeNode(input[0])",
          loc: {
            start: { line: 20, column: 15 },
            end: { line: 20, column: 37 },
          },
          _callId: false,
          _resultCallId: 33,
          _traceId: 35,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "[root]",
          loc: {
            start: { line: 21, column: 20 },
            end: { line: 21, column: 26 },
          },
          _callId: false,
          _traceId: 36,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "1",
          loc: {
            start: { line: 22, column: 15 },
            end: { line: 22, column: 16 },
          },
          _callId: false,
          _traceId: 37,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "0",
          loc: {
            start: { line: 24, column: 20 },
            end: { line: 24, column: 21 },
          },
          _callId: false,
          _traceId: 38,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 24, column: 32 },
            end: { line: 24, column: 37 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 39,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "iInput",
          loc: {
            start: { line: 24, column: 23 },
            end: { line: 24, column: 29 },
            identifierName: "iInput",
          },
          _callId: false,
          _traceId: 40,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input.length",
          loc: {
            start: { line: 24, column: 32 },
            end: { line: 24, column: 44 },
          },
          _callId: false,
          _traceId: 41,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "++iQueue",
          loc: {
            start: { line: 24, column: 46 },
            end: { line: 24, column: 54 },
          },
          _callId: false,
          _traceId: 42,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "nodeQueue",
          loc: {
            start: { line: 25, column: 17 },
            end: { line: 25, column: 26 },
            identifierName: "nodeQueue",
          },
          _callId: false,
          _traceId: 43,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "iQueue",
          loc: {
            start: { line: 25, column: 27 },
            end: { line: 25, column: 33 },
            identifierName: "iQueue",
          },
          _callId: false,
          _traceId: 44,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "nodeQueue[iQueue]",
          loc: {
            start: { line: 25, column: 17 },
            end: { line: 25, column: 34 },
          },
          _callId: false,
          _traceId: 45,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "iInput++",
          loc: {
            start: { line: 28, column: 20 },
            end: { line: 28, column: 28 },
          },
          _callId: false,
          _traceId: 46,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 28, column: 14 },
            end: { line: 28, column: 19 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 47,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input[iInput++]",
          loc: {
            start: { line: 28, column: 14 },
            end: { line: 28, column: 29 },
          },
          _callId: false,
          _traceId: 48,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "val",
          loc: {
            start: { line: 29, column: 8 },
            end: { line: 29, column: 11 },
            identifierName: "val",
          },
          _callId: false,
          _traceId: 49,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "null",
          loc: {
            start: { line: 29, column: 16 },
            end: { line: 29, column: 20 },
          },
          _callId: false,
          _traceId: 50,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "nodeQueue",
          loc: {
            start: { line: 30, column: 6 },
            end: { line: 30, column: 15 },
            identifierName: "nodeQueue",
          },
          _callId: false,
          _traceId: 51,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "nodeQueue.push",
          loc: {
            start: { line: 30, column: 6 },
            end: { line: 30, column: 20 },
          },
          _callId: false,
          _traceId: 52,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "node",
          loc: {
            start: { line: 30, column: 21 },
            end: { line: 30, column: 25 },
            identifierName: "node",
          },
          _callId: false,
          _traceId: 53,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "TreeNode",
          loc: {
            start: { line: 30, column: 37 },
            end: { line: 30, column: 45 },
            identifierName: "TreeNode",
          },
          _callId: false,
          _traceId: 54,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "new TreeNode(val)",
          loc: {
            start: { line: 30, column: 33 },
            end: { line: 30, column: 50 },
          },
          _callId: 55,
          _traceId: 55,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "val",
          loc: {
            start: { line: 30, column: 46 },
            end: { line: 30, column: 49 },
            identifierName: "val",
          },
          _callId: 55,
          _traceId: 56,
          _staticContextId: 3,
          type: 9,
        },
        {
          displayName: "new TreeNode(val)",
          loc: {
            start: { line: 30, column: 33 },
            end: { line: 30, column: 50 },
          },
          _callId: false,
          _resultCallId: 55,
          _traceId: 57,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "node.left = new TreeNode(val)",
          loc: {
            start: { line: 30, column: 21 },
            end: { line: 30, column: 50 },
          },
          _callId: 59,
          _traceId: 58,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "nodeQueue.push(node.left = new TreeNode(val))",
          loc: {
            start: { line: 30, column: 6 },
            end: { line: 30, column: 51 },
          },
          _callId: 59,
          _traceId: 59,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "nodeQueue.push(node.left = new TreeNode(val))",
          loc: {
            start: { line: 30, column: 6 },
            end: { line: 30, column: 51 },
          },
          _callId: false,
          _resultCallId: 59,
          _traceId: 60,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "val !== null",
          loc: {
            start: { line: 29, column: 8 },
            end: { line: 29, column: 20 },
          },
          _callId: false,
          _traceId: 61,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: {
            start: { line: 29, column: 22 },
            end: { line: 29, column: 23 },
          },
          _callId: false,
          _traceId: 62,
          _staticContextId: 3,
          type: 15,
        },
        {
          loc: { start: { line: 31, column: 4 }, end: { line: 31, column: 5 } },
          _callId: false,
          _traceId: 63,
          _staticContextId: 3,
          type: 16,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 33, column: 18 },
            end: { line: 33, column: 23 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 64,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "iInput",
          loc: {
            start: { line: 33, column: 8 },
            end: { line: 33, column: 14 },
            identifierName: "iInput",
          },
          _callId: false,
          _traceId: 65,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input.length",
          loc: {
            start: { line: 33, column: 18 },
            end: { line: 33, column: 30 },
          },
          _callId: false,
          _traceId: 66,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "break;",
          loc: {
            start: { line: 34, column: 6 },
            end: { line: 34, column: 12 },
          },
          _callId: false,
          _traceId: 67,
          _staticContextId: 3,
          type: 14,
        },
        {
          displayName: "iInput >= input.length",
          loc: {
            start: { line: 33, column: 8 },
            end: { line: 33, column: 30 },
          },
          _callId: false,
          _traceId: 68,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: {
            start: { line: 33, column: 32 },
            end: { line: 33, column: 33 },
          },
          _callId: false,
          _traceId: 69,
          _staticContextId: 3,
          type: 15,
        },
        {
          loc: { start: { line: 35, column: 4 }, end: { line: 35, column: 5 } },
          _callId: false,
          _traceId: 70,
          _staticContextId: 3,
          type: 16,
        },
        {
          displayName: "iInput++",
          loc: {
            start: { line: 38, column: 16 },
            end: { line: 38, column: 24 },
          },
          _callId: false,
          _traceId: 71,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "input",
          loc: {
            start: { line: 38, column: 10 },
            end: { line: 38, column: 15 },
            identifierName: "input",
          },
          _callId: false,
          _traceId: 72,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "val = input[iInput++]",
          loc: {
            start: { line: 38, column: 4 },
            end: { line: 38, column: 25 },
          },
          _callId: false,
          _traceId: 73,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "val",
          loc: {
            start: { line: 39, column: 8 },
            end: { line: 39, column: 11 },
            identifierName: "val",
          },
          _callId: false,
          _traceId: 74,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "null",
          loc: {
            start: { line: 39, column: 16 },
            end: { line: 39, column: 20 },
          },
          _callId: false,
          _traceId: 75,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "nodeQueue",
          loc: {
            start: { line: 40, column: 6 },
            end: { line: 40, column: 15 },
            identifierName: "nodeQueue",
          },
          _callId: false,
          _traceId: 76,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "nodeQueue.push",
          loc: {
            start: { line: 40, column: 6 },
            end: { line: 40, column: 20 },
          },
          _callId: false,
          _traceId: 77,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "node",
          loc: {
            start: { line: 40, column: 21 },
            end: { line: 40, column: 25 },
            identifierName: "node",
          },
          _callId: false,
          _traceId: 78,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "TreeNode",
          loc: {
            start: { line: 40, column: 38 },
            end: { line: 40, column: 46 },
            identifierName: "TreeNode",
          },
          _callId: false,
          _traceId: 79,
          _staticContextId: 3,
          type: 8,
        },
        {
          displayName: "new TreeNode(val)",
          loc: {
            start: { line: 40, column: 34 },
            end: { line: 40, column: 51 },
          },
          _callId: 80,
          _traceId: 80,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "val",
          loc: {
            start: { line: 40, column: 47 },
            end: { line: 40, column: 50 },
            identifierName: "val",
          },
          _callId: 80,
          _traceId: 81,
          _staticContextId: 3,
          type: 9,
        },
        {
          displayName: "new TreeNode(val)",
          loc: {
            start: { line: 40, column: 34 },
            end: { line: 40, column: 51 },
          },
          _callId: false,
          _resultCallId: 80,
          _traceId: 82,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "node.right = new TreeNode(val)",
          loc: {
            start: { line: 40, column: 21 },
            end: { line: 40, column: 51 },
          },
          _callId: 84,
          _traceId: 83,
          _staticContextId: 3,
          type: 7,
        },
        {
          displayName: "nodeQueue.push(node.right = new TreeNode(val))",
          loc: {
            start: { line: 40, column: 6 },
            end: { line: 40, column: 52 },
          },
          _callId: 84,
          _traceId: 84,
          _staticContextId: 3,
          type: 4,
        },
        {
          displayName: "nodeQueue.push(node.right = new TreeNode(val))",
          loc: {
            start: { line: 40, column: 6 },
            end: { line: 40, column: 52 },
          },
          _callId: false,
          _resultCallId: 84,
          _traceId: 85,
          _staticContextId: 3,
          type: 6,
        },
        {
          displayName: "val !== null",
          loc: {
            start: { line: 39, column: 8 },
            end: { line: 39, column: 20 },
          },
          _callId: false,
          _traceId: 86,
          _staticContextId: 3,
          type: 7,
        },
        {
          loc: {
            start: { line: 39, column: 22 },
            end: { line: 39, column: 23 },
          },
          _callId: false,
          _traceId: 87,
          _staticContextId: 3,
          type: 15,
        },
        {
          loc: { start: { line: 41, column: 4 }, end: { line: 41, column: 5 } },
          _callId: false,
          _traceId: 88,
          _staticContextId: 3,
          type: 16,
        },
        {
          displayName: "root",
          loc: {
            start: { line: 43, column: 9 },
            end: { line: 43, column: 13 },
            identifierName: "root",
          },
          _callId: false,
          _traceId: 89,
          _staticContextId: 3,
          type: 17,
        },
        {
          loc: {
            start: { line: 46, column: 16 },
            end: { line: 46, column: 17 },
          },
          _callId: false,
          _traceId: 90,
          _staticContextId: 4,
          type: 1,
        },
        {
          loc: { start: { line: 48, column: 0 }, end: { line: 48, column: 1 } },
          _callId: false,
          _traceId: 91,
          _staticContextId: 4,
          type: 2,
        },
        {
          loc: { start: { line: 48, column: 0 }, end: { line: 48, column: 1 } },
          _callId: false,
          _traceId: 92,
          _staticContextId: 4,
          type: 23,
        },
        {
          displayName: "buildTree",
          loc: {
            start: { line: 47, column: 2 },
            end: { line: 47, column: 11 },
            identifierName: "buildTree",
          },
          _callId: false,
          _traceId: 93,
          _staticContextId: 4,
          type: 8,
        },
        {
          displayName: "buildTree([1, null, 3, 2, 4, null, 5, 6])",
          loc: {
            start: { line: 47, column: 2 },
            end: { line: 47, column: 43 },
          },
          _callId: 94,
          _traceId: 94,
          _staticContextId: 4,
          type: 4,
        },
        {
          displayName: "[1, null, 3, 2, 4, null, 5, 6]",
          loc: {
            start: { line: 47, column: 12 },
            end: { line: 47, column: 42 },
          },
          _callId: 94,
          _traceId: 95,
          _staticContextId: 4,
          type: 9,
        },
        {
          displayName: "buildTree([1, null, 3, 2, 4, null, 5, 6])",
          loc: {
            start: { line: 47, column: 2 },
            end: { line: 47, column: 43 },
          },
          _callId: false,
          _resultCallId: 94,
          _traceId: 96,
          _staticContextId: 4,
          type: 6,
        },
        {
          displayName: "main",
          loc: {
            start: { line: 50, column: 0 },
            end: { line: 50, column: 4 },
            identifierName: "main",
          },
          _callId: false,
          _traceId: 97,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "main()",
          loc: { start: { line: 50, column: 0 }, end: { line: 50, column: 6 } },
          _callId: 98,
          _traceId: 98,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "main()",
          loc: { start: { line: 50, column: 0 }, end: { line: 50, column: 6 } },
          _callId: false,
          _resultCallId: 98,
          _traceId: 99,
          _staticContextId: 1,
          type: 6,
        },
      ],
      varAccess: [
        {
          _varId: 1,
          _ownerId: 2,
          loc: {
            start: { line: 7, column: 18 },
            end: { line: 7, column: 21 },
            identifierName: "val",
          },
          ownerType: 2,
          name: "val",
        },
        {
          _varId: 2,
          _ownerId: 3,
          loc: {
            start: { line: 16, column: 19 },
            end: { line: 16, column: 24 },
            identifierName: "input",
          },
          ownerType: 2,
          name: "input",
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiVHJlZU5vZGUiLCJ2YWwiLCJsZWZ0IiwicmlnaHQiLCJidWlsZFRyZWUiLCJpbnB1dCIsImlzU3RyaW5nIiwiSlNPTiIsInBhcnNlIiwicm9vdCIsIm5vZGVRdWV1ZSIsImlJbnB1dCIsImlRdWV1ZSIsImxlbmd0aCIsIm5vZGUiLCJwdXNoIiwibWFpbiJdLCJtYXBwaW5ncyI6IjtBQUNBLG9FLENBREE7O0FBR0E7QUFDQTs7QUFFQSxXQUFTQSxRQUFULENBQWtCQyxHQUFsQixFQUF1Qix1RUFBTEEsR0FBSztBQUNyQixrREFBS0EsR0FBTCxHQUFXQSxHQUFYO0FBQ0Esb0RBQUtDLElBQUwsdUJBQVksMEJBQUtDLEtBQUwsR0FBYSxJQUF6QixHQUZxQjtBQUd0QixLQUhzQiw2Q0FHdEI7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFTQyxTQUFULENBQW1CQyxLQUFuQixFQUEwQix5RUFBUEEsS0FBTztBQUN4Qiw4QkFBSUMsOEJBQUosb0NBQUksNkJBQVNELEtBQVQsRUFBSixpQkFBcUI7QUFDbkIsZ0NBQUFBLEtBQUssd0JBQUdFLEtBQUFBLElBQUgsdUJBQUcsV0FBS0MsS0FBUixvQ0FBRyxrQ0FBV0gsS0FBWCxFQUFILEVBQUw7QUFDRCxXQUZEO0FBR0EsWUFBTUksSUFBSSx3QkFBT1QsWUFBQUEsUUFBUCxvQ0FBRyxpQ0FBYSxvQkFBQUssS0FBSyxzQkFBQyxDQUFELEVBQWxCLEVBQUgsRUFBVjtBQUNBLFlBQU1LLFNBQVMsdUJBQUcsQ0FBQ0QsSUFBRCxDQUFILENBQWY7QUFDQSxVQUFJRSxNQUFNLHVCQUFHLENBQUgsQ0FBVjs7QUFFQSxXQUFLLElBQUlDLE1BQU0sdUJBQUcsQ0FBSCxDQUFmLEVBQXFCLG9CQUFBRCxNQUFNLHdCQUFHLG9CQUFBTixLQUFLLEVBQUNRLE1BQVQsQ0FBM0Isc0JBQTRDLEVBQUVELE1BQTlDLEdBQXNEO0FBQ3BELGNBQU1FLElBQUksdUJBQUcsb0JBQUFKLFNBQVMsc0JBQUNFLE1BQUQsRUFBWixDQUFWOztBQUVBO0FBQ0EsWUFBSVgsR0FBRyx1QkFBRyxvQkFBQUksS0FBSyxzQkFBQ00sTUFBTSxFQUFQLEVBQVIsQ0FBUDtBQUNBLGdDQUFJLG9CQUFBVixHQUFHLDBCQUFLLElBQUwsQ0FBUCxpQkFBa0I7QUFDaEIsd0NBQUFTLFNBQVMsdUJBQVQsYUFBVUssSUFBRCxvQ0FBVCxxQ0FBZSxvQkFBQUQsSUFBSSxFQUFDWixJQUFMLHdCQUFnQkYsYUFBQUEsUUFBaEIsb0NBQVksa0NBQWFDLEdBQWIsRUFBWixFQUFmLEVBQVMsQ0FBVDtBQUNELGFBRkQ7O0FBSUEsZ0NBQUksb0JBQUFVLE1BQU0seUJBQUksb0JBQUFOLEtBQUssRUFBQ1EsTUFBVixDQUFWLGlCQUE0QjtBQUMxQjtBQUNELGFBRkQ7O0FBSUE7QUFDQSw0QkFBQVosR0FBRyxHQUFHLG9CQUFBSSxLQUFLLHNCQUFDTSxNQUFNLEVBQVAsRUFBWDtBQUNBLGdDQUFJLG9CQUFBVixHQUFHLDBCQUFLLElBQUwsQ0FBUCxpQkFBa0I7QUFDaEIsd0NBQUFTLFNBQVMsdUJBQVQsYUFBVUssSUFBRCxvQ0FBVCxxQ0FBZSxvQkFBQUQsSUFBSSxFQUFDWCxLQUFMLHdCQUFpQkgsYUFBQUEsUUFBakIsb0NBQWEsa0NBQWFDLEdBQWIsRUFBYixFQUFmLEVBQVMsQ0FBVDtBQUNELGFBRkQ7QUFHRDtBQUNELGlDQUFPUSxJQUFQLEVBM0J3QjtBQTRCekIsS0E1QnlCLDhDQTRCekI7O0FBRUQsV0FBU08sSUFBVCxHQUFnQjtBQUNkLHVDQUFBWixTQUFTLG9DQUFULDhCQUFVLENBQUMsQ0FBRCxFQUFJLElBQUosRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixJQUFuQixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUFWLEVBQVMsQ0FBVCxDQURjO0FBRWYsS0FGZSw4Q0FFZjs7QUFFRCw4QkFBQVksSUFBSSxvQ0FBSixPQUFJLENBQUosQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCBpc1N0cmluZyBmcm9tICcuLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzU3RyaW5nJztcclxuaW1wb3J0IGlzU3RyaW5nIGZyb20gJ2xvZGFzaC9pc1N0cmluZyc7XHJcblxyXG4vLyBodHRwczovL2xlZXRjb2RlLmNvbS9zdWJtaXNzaW9ucy9kZXRhaWwvMjU4MzAwODM5L1xyXG4vLyBodHRwczovL2xlZXRjb2RlLmNvbS9wcm9ibGVtcy90cmltLWEtYmluYXJ5LXNlYXJjaC10cmVlL1xyXG5cclxuZnVuY3Rpb24gVHJlZU5vZGUodmFsKSB7XHJcbiAgdGhpcy52YWwgPSB2YWw7XHJcbiAgdGhpcy5sZWZ0ID0gdGhpcy5yaWdodCA9IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUYWtlcyAoYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2Ygb3IpIGEgcHJlLW9yZGVyIHRyYXZlcnNhbCBhcnJheSBhbmQgcmV0dXJucyBhIG5ldyB0cmVlIGZvciBpdC5cclxuICogWW91IGNhbiBmaW5kIHNvbWV0aGluZyBzaW1pbGFyIG9uIGxlZXRjb2RlIHBsYXlncm91bmQ6IGh0dHBzOi8vbGVldGNvZGUuY29tL3BsYXlncm91bmQvbmV3L2JpbmFyeS10cmVlXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFRyZWUoaW5wdXQpIHtcclxuICBpZiAoaXNTdHJpbmcoaW5wdXQpKSB7XHJcbiAgICBpbnB1dCA9IEpTT04ucGFyc2UoaW5wdXQpO1xyXG4gIH1cclxuICBjb25zdCByb290ID0gbmV3IFRyZWVOb2RlKGlucHV0WzBdKTtcclxuICBjb25zdCBub2RlUXVldWUgPSBbcm9vdF07XHJcbiAgbGV0IGlJbnB1dCA9IDE7XHJcblxyXG4gIGZvciAobGV0IGlRdWV1ZSA9IDA7IGlJbnB1dCA8IGlucHV0Lmxlbmd0aDsgKytpUXVldWUpIHtcclxuICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWVbaVF1ZXVlXTtcclxuXHJcbiAgICAvLyBsZWZ0XHJcbiAgICBsZXQgdmFsID0gaW5wdXRbaUlucHV0KytdO1xyXG4gICAgaWYgKHZhbCAhPT0gbnVsbCkge1xyXG4gICAgICBub2RlUXVldWUucHVzaChub2RlLmxlZnQgPSBuZXcgVHJlZU5vZGUodmFsKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlJbnB1dCA+PSBpbnB1dC5sZW5ndGgpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmlnaHRcclxuICAgIHZhbCA9IGlucHV0W2lJbnB1dCsrXTtcclxuICAgIGlmICh2YWwgIT09IG51bGwpIHtcclxuICAgICAgbm9kZVF1ZXVlLnB1c2gobm9kZS5yaWdodCA9IG5ldyBUcmVlTm9kZSh2YWwpKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJvb3Q7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oKSB7XHJcbiAgYnVpbGRUcmVlKFsxLCBudWxsLCAzLCAyLCA0LCBudWxsLCA1LCA2XSk7XHJcbn1cclxuXHJcbm1haW4oKTtcclxuIl19

