var _dbux = _dbux_init(
  typeof __dbux__ !== "undefined" || require("@dbux/runtime")
);
var _contextId2 = _dbux.getProgramContextId();
var _tid = _dbux.newTraceId,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tw = _dbux.traceWrite,
  _tc = _dbux.traceCallee,
  _tca = _dbux.traceCallArgument,
  _tcr = _dbux.traceCallResult;
try {
  var _t3_ = _td(3),
    _t6_ = _td(6);
  var _t7_, _t8_, _t9_, _t10_;
  let sum = _tw(
    _te(0, (_t7_ = _tid(7)), 0, null),
    (_t8_ = _tid(8)),
    _t3_,
    [_t7_],
    0
  );
  _tcr(_tc(identity, (_t9_ = _tid(9)), _t6_, null)(), (_t10_ = _tid(10)), _t9_);
  for (
    let i = _tw(
      _te(1, (_t11_ = _tid(11)), 0, null),
      (_t12_ = _tid(12)),
      _t4_,
      [_t11_],
      0
    );
    _te(
      _te(i, (_t13_ = _tid(13)), _t4_, null) <
        _te(8, (_t14_ = _tid(14)), 0, null),
      (_t15_ = _tid(15)),
      0,
      [_t13_, _t14_]
    );
    _tw(
      (i += _te(2, (_t16_ = _tid(16)), 0, null)),
      (_t17_ = _tid(17)),
      _t4_,
      [_t16_],
      0
    )
  ) {
    var _t4_ = _td(4);
    var _t11_,
      _t12_,
      _t13_,
      _t14_,
      _t15_,
      _t16_,
      _t17_,
      _t18_,
      _t19_,
      _t20_,
      _t21_,
      _t22_,
      _t23_,
      _t24_,
      _t25_,
      _t26_,
      _t27_;
    _tw(
      (sum += _te(
        _te(i, (_t18_ = _tid(18)), _t4_, null) *
          _te(i, (_t19_ = _tid(19)), _t4_, null),
        (_t20_ = _tid(20)),
        0,
        [_t18_, _t19_]
      )),
      (_t21_ = _tid(21)),
      _t3_,
      [_t20_],
      0
    );
    _tcr(
      _tc(
        console.log,
        (_t22_ = _tid(22)),
        0,
        null
      )(_tca(sum, (_t23_ = _tid(23)), _t3_, null, _t22_)),
      (_t24_ = _tid(24)),
      _t22_
    );
    if (
      _te(
        _te(i, (_t25_ = _tid(25)), _t4_, null) <
          _te(4, (_t26_ = _tid(26)), 0, null),
        (_t27_ = _tid(27)),
        0,
        [_t25_, _t26_]
      )
    ) {
      var _t28_, _t29_, _t30_;
      _tcr(
        _tc(
          identity,
          (_t28_ = _tid(28)),
          _t6_,
          null
        )(_tca(sum, (_t29_ = _tid(29)), _t3_, null, _t28_)),
        (_t30_ = _tid(30)),
        _t28_
      );
    }
  }

  function identity(x) {
    var _contextId = _pI(2, false);
    try {
      return x;
    } finally {
      _pF(_contextId);
    }
  }
  _dbux.t(32);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "for1.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\for1.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 14, column: 1 } },
          type: 1,
          name: "for1.js",
          displayName: "for1.js",
          fileName: "for1.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\for1.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 12, column: 0 }, end: { line: 14, column: 1 } },
          type: 2,
          name: "identity",
          displayName: "identity",
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
          loc: { start: { line: 14, column: 0 }, end: { line: 14, column: 1 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "sum",
          loc: {
            start: { line: 1, column: 4 },
            end: { line: 1, column: 7 },
            identifierName: "sum",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 11,
        },
        {
          displayName: "i",
          loc: {
            start: { line: 3, column: 9 },
            end: { line: 3, column: 10 },
            identifierName: "i",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 11,
        },
        {
          loc: {
            start: { line: 12, column: 21 },
            end: { line: 12, column: 22 },
          },
          _traceId: 5,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "identity",
          loc: {
            start: { line: 12, column: 9 },
            end: { line: 12, column: 17 },
            identifierName: "identity",
          },
          _traceId: 6,
          _staticContextId: 2,
          type: 11,
        },
        {
          displayName: "0",
          loc: { start: { line: 1, column: 10 }, end: { line: 1, column: 11 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "sum = 0",
          loc: { start: { line: 1, column: 4 }, end: { line: 1, column: 11 } },
          _traceId: 8,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "identity",
          loc: {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 8 },
            identifierName: "identity",
          },
          _traceId: 9,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "identity()",
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } },
          _traceId: 10,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "1",
          loc: { start: { line: 3, column: 13 }, end: { line: 3, column: 14 } },
          _traceId: 11,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "i = 1",
          loc: { start: { line: 3, column: 9 }, end: { line: 3, column: 14 } },
          _traceId: 12,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "i",
          loc: {
            start: { line: 3, column: 16 },
            end: { line: 3, column: 17 },
            identifierName: "i",
          },
          _traceId: 13,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "8",
          loc: { start: { line: 3, column: 20 }, end: { line: 3, column: 21 } },
          _traceId: 14,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "i < 8",
          loc: { start: { line: 3, column: 16 }, end: { line: 3, column: 21 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "2",
          loc: { start: { line: 3, column: 28 }, end: { line: 3, column: 29 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "i += 2",
          loc: { start: { line: 3, column: 23 }, end: { line: 3, column: 29 } },
          _traceId: 17,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "i",
          loc: {
            start: { line: 4, column: 9 },
            end: { line: 4, column: 10 },
            identifierName: "i",
          },
          _traceId: 18,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "i",
          loc: {
            start: { line: 4, column: 13 },
            end: { line: 4, column: 14 },
            identifierName: "i",
          },
          _traceId: 19,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "i * i",
          loc: { start: { line: 4, column: 9 }, end: { line: 4, column: 14 } },
          _traceId: 20,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "sum += i * i",
          loc: { start: { line: 4, column: 2 }, end: { line: 4, column: 14 } },
          _traceId: 21,
          _staticContextId: 1,
          type: 12,
        },
        {
          displayName: "console.log",
          loc: { start: { line: 5, column: 2 }, end: { line: 5, column: 13 } },
          _traceId: 22,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "sum",
          loc: {
            start: { line: 5, column: 14 },
            end: { line: 5, column: 17 },
            identifierName: "sum",
          },
          _traceId: 23,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "console.log(sum)",
          loc: { start: { line: 5, column: 2 }, end: { line: 5, column: 18 } },
          _traceId: 24,
          _staticContextId: 1,
          type: 6,
        },
        {
          displayName: "i",
          loc: {
            start: { line: 6, column: 6 },
            end: { line: 6, column: 7 },
            identifierName: "i",
          },
          _traceId: 25,
          _staticContextId: 1,
          type: 13,
        },
        {
          displayName: "4",
          loc: { start: { line: 6, column: 10 }, end: { line: 6, column: 11 } },
          _traceId: 26,
          _staticContextId: 1,
          type: 8,
        },
        {
          displayName: "i < 4",
          loc: { start: { line: 6, column: 6 }, end: { line: 6, column: 11 } },
          _traceId: 27,
          _staticContextId: 1,
          type: 7,
        },
        {
          displayName: "identity",
          loc: {
            start: { line: 7, column: 4 },
            end: { line: 7, column: 12 },
            identifierName: "identity",
          },
          _traceId: 28,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "sum",
          loc: {
            start: { line: 7, column: 13 },
            end: { line: 7, column: 16 },
            identifierName: "sum",
          },
          _traceId: 29,
          _staticContextId: 1,
          type: 4,
        },
        {
          displayName: "identity(sum)",
          loc: { start: { line: 7, column: 4 }, end: { line: 7, column: 17 } },
          _traceId: 30,
          _staticContextId: 1,
          type: 6,
        },
        {
          loc: { start: { line: 14, column: 0 }, end: { line: 14, column: 1 } },
          _traceId: 31,
          _staticContextId: 2,
          type: 2,
        },
        {
          loc: { start: { line: 14, column: 0 }, end: { line: 14, column: 1 } },
          _traceId: 32,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsic3VtIiwiaWRlbnRpdHkiLCJpIiwiY29uc29sZSIsImxvZyIsIngiXSwibWFwcGluZ3MiOiJxYkFBQSxJQUFJQSxHQUFHLFdBQUcsQ0FBSCw0REFBUDtBQUNBLFdBQUFDLFFBQVEsNkJBQVI7QUFDQSxPQUFLLElBQUlDLENBQUMsV0FBRyxDQUFILGlFQUFWLE1BQWdCLElBQUFBLENBQUMsK0JBQUQsT0FBSSxDQUFKLDRCQUFoQiw0Q0FBdUJBLENBQUMsUUFBSSxDQUFKLDRCQUF4Qix1Q0FBK0I7QUFDN0IsUUFBQUYsR0FBRyxRQUFJLElBQUFFLENBQUMsK0JBQUQsT0FBSUEsQ0FBSiwrQkFBSixzQ0FBSDtBQUNBLGFBQUFDLE9BQU8sQ0FBQ0MsR0FBUixrQ0FBWUosR0FBWjtBQUNBLFlBQUksSUFBQUUsQ0FBQywrQkFBRCxPQUFJLENBQUosNEJBQUosd0NBQVc7QUFDVCxlQUFBRCxRQUFRLCtCQUFSLE1BQVNELEdBQVQ7QUFDRDtBQUNGOzs7QUFHRCxXQUFTQyxRQUFULENBQWtCSSxDQUFsQixFQUFxQjtBQUNuQixhQUFPQSxDQUFQO0FBQ0QsS0FGb0IsMkJBRXBCLEMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgc3VtID0gMDtcclxuaWRlbnRpdHkoKTtcclxuZm9yIChsZXQgaSA9IDE7IGkgPCA4OyBpICs9IDIpIHtcclxuICBzdW0gKz0gaSAqIGk7XHJcbiAgY29uc29sZS5sb2coc3VtKTtcclxuICBpZiAoaSA8IDQpIHtcclxuICAgIGlkZW50aXR5KHN1bSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaWRlbnRpdHkoeCkge1xyXG4gIHJldHVybiB4O1xyXG59Il19

