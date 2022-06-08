var _dbux = _dbux_init(
  (typeof __dbux__ !== "undefined" && __dbux__) || require("@dbux/runtime")
);
var _cid2 = _dbux.getProgramContextId();
var _al = _dbux.getArgLength,
  _af = _dbux.arrayFrom,
  _uot = _dbux.unitOfType,
  _dfi = _dbux.DefaultInitializerIndicator,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _pFI = _dbux.popFunctionInterruptable,
  _par = _dbux.registerParams,
  _tr = _dbux.traceReturn,
  _tra = _dbux.traceReturnAsync,
  _tt = _dbux.traceThrow,
  _tid = _dbux.newTraceId,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tev = _dbux.traceExpressionVar,
  _twv = _dbux.traceWriteVar,
  _tct = _dbux.traceCatch,
  _tctI = _dbux.traceCatchInterruptable,
  _tf = _dbux.traceFinally,
  _tfI = _dbux.traceFinallyInterruptable,
  _tme = _dbux.traceExpressionME,
  _tmeo = _dbux.traceExpressionMEOptional,
  _twme = _dbux.traceWriteME,
  _tdme = _dbux.traceDeleteME,
  _tue = _dbux.traceUpdateExpressionVar,
  _tume = _dbux.traceUpdateExpressionME,
  _bce = _dbux.traceBCE,
  _a = _dbux.traceArg,
  _tsa = _dbux.traceSpreadArg,
  _tcr = _dbux.traceCallResult,
  _tae = _dbux.traceArrayExpression,
  _toe = _dbux.traceObjectExpression,
  _tfi = _dbux.traceForIn,
  _tc = _dbux.traceClass,
  _ti = _dbux.traceInstance,
  _aw = _dbux.preAwait,
  _aw2 = _dbux.wrapAwait,
  _aw3 = _dbux.postAwait,
  _yi = _dbux.preYield,
  _yi2 = _dbux.wrapYield,
  _yi3 = _dbux.postYield,
  _tp = _dbux.tracePattern;
try {
  var _t6_, _t7_, _t8_;
  class A {
    _dbux_instance = (() => _ti(this, (_t7_ = _tid(7)), []))();
    static _dbux_class = function () {
      _tc(A, (_t8_ = _tid(8)), [], []);
    };
    constructor(x, o) {
      delete this._dbux_instance;
      var _cid = _pI(2, 3, _t6_, false);
      try {
        var _t9_, _t10_, _t11_, _t12_, _t13_, _t14_, _o, _o2, _t15_;
        var _t4_ = _td(4, x, null);
        var _t5_ = _td(5, o, null);
        _par(_t4_, _t5_);
        _twme(
          (_o = _tev(this, (_t9_ = _tid(9)), 0)),
          _t9_,
          "x",
          0,
          (_o.x = _tev(x, (_t10_ = _tid(10)), _t4_)),
          (_t11_ = _tid(11)),
          [_t10_]
        );
        _twme(
          (_o2 = _tev(this, (_t12_ = _tid(12)), 0)),
          _t12_,
          "o",
          0,
          (_o2.o = _tev(o, (_t13_ = _tid(13)), _t5_)),
          (_t14_ = _tid(14)),
          [_t13_]
        );
        _dbux.t(16);
      } finally {
        _pF(_cid, 15);
      }
    }
  }

  // function main(a) {
  //   a.push(new A(a[0], { a: 22 }));
  //   a[1].o.a = 3;
  //   // const b = a.x;
  //   // a.y = b + 3;
  //   return a;
  // }

  // main([112]);
  A._dbux_class(), delete A._dbux_class;
  _dbux.t(17);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  if (!dbuxRuntime.initProgram) {
    throw new Error(
      '[@dbux/runtime] "initProgram" unavailable in "class2-ctor1.js"'
    );
  }
  return dbuxRuntime.initProgram(
    {
      program: {
        _staticId: 1,
        loc: { start: { line: 1, column: 0 }, end: { line: 18, column: 0 } },
        type: 1,
        name: "class2-ctor1.js",
        displayName: "class2-ctor1.js",
        fileName: "class2-ctor1.js",
        filePath:
          "c:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\dep\\class2-ctor1.js",
        programIndex: 1,
      },
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 18, column: 0 } },
          type: 1,
          name: "class2-ctor1.js",
          displayName: "class2-ctor1.js",
          fileName: "class2-ctor1.js",
          filePath:
            "c:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\dep\\class2-ctor1.js",
          programIndex: 1,
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 2, column: 20 }, end: { line: 5, column: 3 } },
          name: "constructor",
          displayName: "A.constructor",
          isInterruptable: false,
          type: 2,
        },
      ],
      traces: [
        {
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          _traceId: 1,
          _staticContextId: 1,
          type: 1,
        },
        {
          loc: { start: { line: 18, column: 0 }, end: { line: 18, column: 0 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 2, column: 20 }, end: { line: 2, column: 21 } },
          _traceId: 3,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "x",
          loc: {
            start: { line: 2, column: 14 },
            end: { line: 2, column: 15 },
            identifierName: "x",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 38,
          data: { name: "x" },
          dataNode: { label: "x" },
        },
        {
          displayName: "o",
          loc: {
            start: { line: 2, column: 17 },
            end: { line: 2, column: 18 },
            identifierName: "o",
          },
          _traceId: 5,
          _staticContextId: 1,
          type: 38,
          data: { name: "o" },
          dataNode: { label: "o" },
        },
        {
          displayName: "A.constructor",
          loc: { start: { line: 2, column: 2 }, end: { line: 5, column: 3 } },
          _traceId: 6,
          _staticContextId: 1,
          type: 42,
          data: { name: "constructor", staticContextId: 2 },
          dataNode: { isNew: true, label: "constructor" },
        },
        {
          displayName: "A.constructor",
          loc: { start: { line: 2, column: 2 }, end: { line: 5, column: 3 } },
          _traceId: 7,
          _staticContextId: 1,
          type: 45,
          data: { privateMethods: [] },
          dataNode: { isNew: true },
        },
        {
          displayName:
            "class A {\n  constructor(x, o) {\n    this.x = x;\n    this.o = o;\n  }\n}",
          loc: { start: { line: 1, column: 0 }, end: { line: 6, column: 1 } },
          _traceId: 8,
          _staticContextId: 1,
          type: 43,
          data: { name: "A", staticMethods: [], publicMethods: [] },
          dataNode: { isNew: true },
        },
        {
          displayName: "this",
          loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 8 } },
          _traceId: 9,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "x",
          loc: {
            start: { line: 3, column: 13 },
            end: { line: 3, column: 14 },
            identifierName: "x",
          },
          _traceId: 10,
          _staticContextId: 2,
          type: 35,
          data: {},
          dataNode: { isNew: false },
        },
        {
          displayName: "this.x = x",
          loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 14 } },
          _traceId: 11,
          _staticContextId: 2,
          type: 33,
          syntax: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "this",
          loc: { start: { line: 4, column: 4 }, end: { line: 4, column: 8 } },
          _traceId: 12,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "o",
          loc: {
            start: { line: 4, column: 13 },
            end: { line: 4, column: 14 },
            identifierName: "o",
          },
          _traceId: 13,
          _staticContextId: 2,
          type: 35,
          data: {},
          dataNode: { isNew: false },
        },
        {
          displayName: "this.o = o",
          loc: { start: { line: 4, column: 4 }, end: { line: 4, column: 14 } },
          _traceId: 14,
          _staticContextId: 2,
          type: 33,
          syntax: 2,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 5, column: 3 }, end: { line: 5, column: 3 } },
          _traceId: 15,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 5, column: 3 }, end: { line: 5, column: 3 } },
          _traceId: 16,
          _staticContextId: 1,
          type: 22,
        },
        {
          loc: { start: { line: 18, column: 0 }, end: { line: 18, column: 0 } },
          _traceId: 17,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}

