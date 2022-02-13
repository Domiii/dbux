"use strict";
var _producer_consumer_base = require("./producer_consumer_base");
var _asyncUtil = require("asyncUtil");
var _dbux = _dbux_init(
  (typeof __dbux__ !== "undefined" && __dbux__) || require("@dbux/runtime")
);
var _cid9 = _dbux.getProgramContextId();
var _al = _dbux.getArgLength,
  _af = _dbux.arrayFrom,
  _uot = _dbux.unitOfType,
  _dfi = _dbux.DefaultInitializerIndicator,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _par = _dbux.registerParams,
  _tr = _dbux.traceReturn,
  _tra = _dbux.traceReturnAsync,
  _tt = _dbux.traceThrow,
  _tid = _dbux.newTraceId,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tev = _dbux.traceExpressionVar,
  _twv = _dbux.traceWriteVar,
  _tcatch = _dbux.traceCatch,
  _tf = _dbux.traceFinally,
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
  _aw3 = _dbux.postAwait;
try {
  var _t4_ = _td(
    4,

    idle
  );
  var _t6_ = _td(
    6,

    consume
  );
  var _t8_ = _td(
    8,

    produce
  );
  var _t12_ = _td(
    12,

    producer
  );
  var _t17_ = _td(
    17,

    consumer
  );
  /** ###########################################################################
   * Basic functions
   *  #########################################################################*/ function idle() {
    var _cid = _pI(2, 3, _t4_, false);
    try {
      var _waitTicksPromise, _t18_, _t19_, _t20_, _t21_, _args, _t22_, _t23_;
      _par(); // return sleep() // for debugging purposes
      //   .then(() =>
      //     waitTicksPromise(IdleTime)
      //   );
      return _tr(
        ((_waitTicksPromise = _tev(
          _asyncUtil.waitTicksPromise,
          (_t18_ = _tid(18)),
          _t18_
        )),
        (_args = [
          _tev(_producer_consumer_base.IdleTime, (_t19_ = _tid(19)), _t19_),
        ]),
        (_waitTicksPromise = _bce(
          (_t20_ = _tid(20)),
          _waitTicksPromise,
          _t18_,
          [_t19_],
          _args
        )),
        _tcr(_waitTicksPromise(_args[0]), (_t21_ = _tid(21)), _t20_)),
        (_t22_ = _tid(22)),
        [_t21_]
      );
    } finally {
      _pF(_cid, 23);
    }
  }
  function consume() {
    var _cid2 = _pI(3, 5, _t6_, false);
    try {
      var _startConsume,
        _getConsumeTime,
        _waitTicksPromise2,
        _waitTicksPromise$the,
        _t24_,
        _t25_,
        _t26_,
        _args2,
        _t30_,
        _t27_,
        _t28_,
        _t29_,
        _args3,
        _t31_,
        _t32_,
        _args4,
        _t36_,
        _t33_,
        _t34_,
        _t35_,
        _args5,
        _t37_,
        _o,
        _t38_;
      _par();
      (_startConsume = _tev(
        _producer_consumer_base.startConsume,
        (_t24_ = _tid(24)),
        _t24_
      )),
        (_args2 = []),
        (_startConsume = _bce(
          (_t25_ = _tid(25)),
          _startConsume,
          _t24_,
          [],
          _args2
        )),
        _tcr(_startConsume(), (_t26_ = _tid(26)), _t25_);
      return _tr(
        ((_o =
          ((_waitTicksPromise2 = _tev(
            _asyncUtil.waitTicksPromise,
            (_t30_ = _tid(30)),
            _t30_
          )),
          (_args4 = [
            ((_getConsumeTime = _tev(
              _producer_consumer_base.getConsumeTime,
              (_t27_ = _tid(27)),
              _t27_
            )),
            (_args3 = []),
            (_getConsumeTime = _bce(
              (_t28_ = _tid(28)),
              _getConsumeTime,
              _t27_,
              [],
              _args3
            )),
            _tcr(_getConsumeTime(), (_t29_ = _tid(29)), _t28_)),
          ]),
          (_waitTicksPromise2 = _bce(
            (_t31_ = _tid(31)),
            _waitTicksPromise2,
            _t30_,
            [_t29_],
            _args4
          )),
          _tcr(_waitTicksPromise2(_args4[0]), (_t32_ = _tid(32)), _t31_))),
        (_waitTicksPromise$the = _tme(
          _o,
          "then",
          _o.then,
          (_t36_ = _tid(36)),
          _t32_
        )),
        (_args5 = [
          _tev(
            _producer_consumer_base.finishConsume,
            (_t33_ = _tid(33)),
            _t33_
          ),
        ]),
        (_waitTicksPromise$the = _bce(
          (_t34_ = _tid(34)),
          _waitTicksPromise$the,
          _t36_,
          [_t33_],
          _args5
        )),
        _tcr(
          _waitTicksPromise$the.call(_o, _args5[0]),
          (_t35_ = _tid(35)),
          _t34_
        )),
        (_t37_ = _tid(37)),
        [_t35_]
      );
    } finally {
      _pF(_cid2, 38);
    }
  }
  function produce() {
    var _cid3 = _pI(4, 7, _t8_, false);
    try {
      var _startProduce,
        _getProduceTime,
        _waitTicksPromise3,
        _waitTicksPromise$the2,
        _t39_,
        _t40_,
        _t41_,
        _args6,
        _t45_,
        _t42_,
        _t43_,
        _t44_,
        _args7,
        _t46_,
        _t47_,
        _args8,
        _t51_,
        _t48_,
        _t49_,
        _t50_,
        _args9,
        _t52_,
        _o2,
        _t53_;
      _par();
      (_startProduce = _tev(
        _producer_consumer_base.startProduce,
        (_t39_ = _tid(39)),
        _t39_
      )),
        (_args6 = []),
        (_startProduce = _bce(
          (_t40_ = _tid(40)),
          _startProduce,
          _t39_,
          [],
          _args6
        )),
        _tcr(_startProduce(), (_t41_ = _tid(41)), _t40_);
      return _tr(
        ((_o2 =
          ((_waitTicksPromise3 = _tev(
            _asyncUtil.waitTicksPromise,
            (_t45_ = _tid(45)),
            _t45_
          )),
          (_args8 = [
            ((_getProduceTime = _tev(
              _producer_consumer_base.getProduceTime,
              (_t42_ = _tid(42)),
              _t42_
            )),
            (_args7 = []),
            (_getProduceTime = _bce(
              (_t43_ = _tid(43)),
              _getProduceTime,
              _t42_,
              [],
              _args7
            )),
            _tcr(_getProduceTime(), (_t44_ = _tid(44)), _t43_)),
          ]),
          (_waitTicksPromise3 = _bce(
            (_t46_ = _tid(46)),
            _waitTicksPromise3,
            _t45_,
            [_t44_],
            _args8
          )),
          _tcr(_waitTicksPromise3(_args8[0]), (_t47_ = _tid(47)), _t46_))),
        (_waitTicksPromise$the2 = _tme(
          _o2,
          "then",
          _o2.then,
          (_t51_ = _tid(51)),
          _t47_
        )),
        (_args9 = [
          _tev(
            _producer_consumer_base.finishProduce,
            (_t48_ = _tid(48)),
            _t48_
          ),
        ]),
        (_waitTicksPromise$the2 = _bce(
          (_t49_ = _tid(49)),
          _waitTicksPromise$the2,
          _t51_,
          [_t48_],
          _args9
        )),
        _tcr(
          _waitTicksPromise$the2.call(_o2, _args9[0]),
          (_t50_ = _tid(50)),
          _t49_
        )),
        (_t52_ = _tid(52)),
        [_t50_]
      );
    } finally {
      _pF(_cid3, 53);
    }
  }
  function producer(n) {
    var _cid4 = _pI(5, 9, _t12_, false);
    try {
      var _repeatPromise,
        _t67_,
        _t68_,
        _t66_,
        _t69_,
        _t70_,
        _args13,
        _t71_,
        _t72_;
      var _t11_ = _td(11, n);
      _par(_t11_);
      return _tr(
        ((_repeatPromise = _tev(
          _asyncUtil.repeatPromise,
          (_t67_ = _tid(67)),
          _t67_
        )),
        (_args13 = [
          _tev(n, (_t68_ = _tid(68)), _t11_),
          _te(
            function producerTick() {
              var _cid5 = _pI(6, 10, _t66_, false);
              try {
                var _hasSpace, _t54_, _t55_, _t56_, _args10, _t65_;
                _par();
                if (
                  ((_hasSpace = _tev(
                    _producer_consumer_base.hasSpace,
                    (_t54_ = _tid(54)),
                    _t54_
                  )),
                  (_args10 = []),
                  (_hasSpace = _bce(
                    (_t55_ = _tid(55)),
                    _hasSpace,
                    _t54_,
                    [],
                    _args10
                  )),
                  _tcr(_hasSpace(), (_t56_ = _tid(56)), _t55_))
                ) {
                  var _produce, _t57_, _t58_, _t59_, _args11, _t60_;
                  return _tr(
                    ((_produce = _tev(produce, (_t57_ = _tid(57)), _t8_)),
                    (_args11 = []),
                    (_produce = _bce(
                      (_t58_ = _tid(58)),
                      _produce,
                      _t57_,
                      [],
                      _args11
                    )),
                    _tcr(_produce(), (_t59_ = _tid(59)), _t58_)),
                    (_t60_ = _tid(60)),
                    [_t59_]
                  );
                } else {
                  var _idle, _t61_, _t62_, _t63_, _args12, _t64_;
                  return _tr(
                    ((_idle = _tev(idle, (_t61_ = _tid(61)), _t4_)),
                    (_args12 = []),
                    (_idle = _bce(
                      (_t62_ = _tid(62)),
                      _idle,
                      _t61_,
                      [],
                      _args12
                    )),
                    _tcr(_idle(), (_t63_ = _tid(63)), _t62_)),
                    (_t64_ = _tid(64)),
                    [_t63_]
                  );
                }
                _dbux.t(110);
              } finally {
                _pF(_cid5, 65);
              }
            },
            (_t66_ = _tid(66)),
            null
          ),
        ]),
        (_repeatPromise = _bce(
          (_t69_ = _tid(69)),
          _repeatPromise,
          _t67_,
          [_t68_, _t66_],
          _args13
        )),
        _tcr(
          _repeatPromise(_args13[0], _args13[1]),
          (_t70_ = _tid(70)),
          _t69_
        )),
        (_t71_ = _tid(71)),
        [_t70_]
      );
    } finally {
      _pF(_cid4, 72);
    }
  }
  function consumer(n) {
    var _cid6 = _pI(7, 13, _t17_, false);
    try {
      var _repeatPromise2,
        _t105_,
        _t77_,
        _t104_,
        _t106_,
        _t107_,
        _args19,
        _t108_,
        _t109_;
      var _t16_ = _td(16, n);
      _par(_t16_);
      return _tr(
        ((_repeatPromise2 = _tev(
          _asyncUtil.repeatPromise,
          (_t105_ = _tid(105)),
          _t105_
        )),
        (_args19 = [
          _te(
            () => {
              var _cid7 = _pI(8, 14, _t77_, false);
              try {
                var _t73_, _t74_, _t75_, _t76_;
                _par();
                return _tr(
                  _te(!_te(!n, (_t73_ = _tid(73)), []), (_t74_ = _tid(74)), [
                    _t73_,
                  ]),
                  (_t76_ = _tid(76)),
                  [_t74_]
                );
              } finally {
                _pF(_cid7, 75);
              }
            },
            (_t77_ = _tid(77)),
            null
          ),
          _te(
            function consumerTick() {
              var _cid8 = _pI(9, 15, _t104_, false);
              try {
                var _hasItems, _t78_, _t79_, _t80_, _args14, _o3, _o4, _t103_;
                _par();
                if (
                  ((_hasItems = _tev(
                    _producer_consumer_base.hasItems,
                    (_t78_ = _tid(78)),
                    _t78_
                  )),
                  (_args14 = []),
                  (_hasItems = _bce(
                    (_t79_ = _tid(79)),
                    _hasItems,
                    _t78_,
                    [],
                    _args14
                  )),
                  _tcr(_hasItems(), (_t80_ = _tid(80)), _t79_))
                ) {
                  var _console$log,
                    _consume,
                    _t81_,
                    _t82_,
                    _n,
                    _t87_,
                    _t88_,
                    _t83_,
                    _t84_,
                    _t85_,
                    _t86_,
                    _args15,
                    _t89_,
                    _t90_,
                    _t91_,
                    _args16,
                    _t92_;
                  _tue(
                    (n = _n = _tev(n, (_t81_ = _tid(81)), _t16_) - _uot(n)),
                    _n,
                    _t81_,
                    (_t82_ = _tid(82)),
                    _t16_
                  );
                  (_o3 = _tev(console, (_t87_ = _tid(87)), _t87_)),
                    (_console$log = _tme(
                      _o3,
                      "log",
                      _o3.log,
                      (_t88_ = _tid(88)),
                      _t87_
                    )),
                    (_args15 = [
                      _te("cons", (_t83_ = _tid(83)), null),
                      _tev(n, (_t84_ = _tid(84)), _t16_),
                    ]),
                    (_console$log = _bce(
                      (_t85_ = _tid(85)),
                      _console$log,
                      _t88_,
                      [_t83_, _t84_],
                      _args15
                    )),
                    _tcr(
                      _console$log.call(_o3, _args15[0], _args15[1]),
                      (_t86_ = _tid(86)),
                      _t85_
                    );
                  return _tr(
                    ((_consume = _tev(consume, (_t89_ = _tid(89)), _t6_)),
                    (_args16 = []),
                    (_consume = _bce(
                      (_t90_ = _tid(90)),
                      _consume,
                      _t89_,
                      [],
                      _args16
                    )),
                    _tcr(_consume(), (_t91_ = _tid(91)), _t90_)),
                    (_t92_ = _tid(92)),
                    [_t91_]
                  );
                } else {
                  var _console$log2,
                    _idle2,
                    _t97_,
                    _t98_,
                    _t93_,
                    _t94_,
                    _t95_,
                    _t96_,
                    _args17,
                    _t99_,
                    _t100_,
                    _t101_,
                    _args18,
                    _t102_;
                  (_o4 = _tev(console, (_t97_ = _tid(97)), _t97_)),
                    (_console$log2 = _tme(
                      _o4,
                      "log",
                      _o4.log,
                      (_t98_ = _tid(98)),
                      _t97_
                    )),
                    (_args17 = [
                      _te("cons idle", (_t93_ = _tid(93)), null),
                      _tev(n, (_t94_ = _tid(94)), _t16_),
                    ]),
                    (_console$log2 = _bce(
                      (_t95_ = _tid(95)),
                      _console$log2,
                      _t98_,
                      [_t93_, _t94_],
                      _args17
                    )),
                    _tcr(
                      _console$log2.call(_o4, _args17[0], _args17[1]),
                      (_t96_ = _tid(96)),
                      _t95_
                    );
                  return _tr(
                    ((_idle2 = _tev(idle, (_t99_ = _tid(99)), _t4_)),
                    (_args18 = []),
                    (_idle2 = _bce(
                      (_t100_ = _tid(100)),
                      _idle2,
                      _t99_,
                      [],
                      _args18
                    )),
                    _tcr(_idle2(), (_t101_ = _tid(101)), _t100_)),
                    (_t102_ = _tid(102)),
                    [_t101_]
                  );
                }
                _dbux.t(111);
              } finally {
                _pF(_cid8, 103);
              }
            },
            (_t104_ = _tid(104)),
            null
          ),
        ]),
        (_repeatPromise2 = _bce(
          (_t106_ = _tid(106)),
          _repeatPromise2,
          _t105_,
          [_t77_, _t104_],
          _args19
        )),
        _tcr(
          _repeatPromise2(_args19[0], _args19[1]),
          (_t107_ = _tid(107)),
          _t106_
        )),
        (_t108_ = _tid(108)),
        [_t107_]
      );
    } finally {
      _pF(_cid6, 109);
    }
  }

  /** ###########################################################################
   * Main
   *  #########################################################################*/

  // producer(2*N);
  // consumer(N);
  // consumer(N);
  // consumer(N);
  // producer(N);
  _dbux.t(112);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      program: {
        _staticId: 1,
        loc: { start: { line: 1, column: 0 }, end: { line: 64, column: 15 } },
        type: 1,
        name: "producer_consumer_promise.js",
        displayName: "producer_consumer_promise.js",
        fileName: "producer_consumer_promise.js",
        filePath:
          "C:\\Users\\domin\\code\\dbux\\samples\\case-studies\\async\\producer_consumer\\producer_consumer_promise.js",
        programIndex: 1,
      },
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 64, column: 15 } },
          type: 1,
          name: "producer_consumer_promise.js",
          displayName: "producer_consumer_promise.js",
          fileName: "producer_consumer_promise.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\case-studies\\async\\producer_consumer\\producer_consumer_promise.js",
          programIndex: 1,
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 8, column: 16 }, end: { line: 14, column: 1 } },
          type: 2,
          name: "idle",
          displayName: "idle",
          isInterruptable: false,
        },
        {
          _staticId: 3,
          _parentId: 1,
          loc: {
            start: { line: 16, column: 19 },
            end: { line: 20, column: 1 },
          },
          type: 2,
          name: "consume",
          displayName: "consume",
          isInterruptable: false,
        },
        {
          _staticId: 4,
          _parentId: 1,
          loc: {
            start: { line: 22, column: 19 },
            end: { line: 26, column: 1 },
          },
          type: 2,
          name: "produce",
          displayName: "produce",
          isInterruptable: false,
        },
        {
          _staticId: 5,
          _parentId: 1,
          loc: {
            start: { line: 28, column: 21 },
            end: { line: 37, column: 1 },
          },
          type: 2,
          name: "producer",
          displayName: "producer",
          isInterruptable: false,
        },
        {
          _staticId: 6,
          _parentId: 5,
          loc: {
            start: { line: 29, column: 50 },
            end: { line: 36, column: 3 },
          },
          type: 2,
          name: "producerTick",
          displayName: "producerTick",
          isInterruptable: false,
        },
        {
          _staticId: 7,
          _parentId: 1,
          loc: {
            start: { line: 39, column: 21 },
            end: { line: 54, column: 1 },
          },
          type: 2,
          name: "consumer",
          displayName: "consumer",
          isInterruptable: false,
        },
        {
          _staticId: 8,
          _parentId: 7,
          loc: {
            start: { line: 41, column: 10 },
            end: { line: 41, column: 13 },
          },
          type: 2,
          displayName: "[cb] repeatPromise",
          isInterruptable: false,
        },
        {
          _staticId: 9,
          _parentId: 7,
          loc: {
            start: { line: 42, column: 28 },
            end: { line: 52, column: 5 },
          },
          type: 2,
          name: "consumerTick",
          displayName: "consumerTick",
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
          loc: {
            start: { line: 64, column: 14 },
            end: { line: 64, column: 15 },
          },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 8, column: 16 }, end: { line: 8, column: 17 } },
          _traceId: 3,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "idle",
          loc: {
            start: { line: 8, column: 9 },
            end: { line: 8, column: 13 },
            identifierName: "idle",
          },
          _traceId: 4,
          _staticContextId: 1,
          type: 41,
          data: { name: "idle", staticContextId: 2 },
          dataNode: { isNew: true },
        },
        {
          loc: {
            start: { line: 16, column: 19 },
            end: { line: 16, column: 20 },
          },
          _traceId: 5,
          _staticContextId: 3,
          type: 1,
        },
        {
          displayName: "consume",
          loc: {
            start: { line: 16, column: 9 },
            end: { line: 16, column: 16 },
            identifierName: "consume",
          },
          _traceId: 6,
          _staticContextId: 1,
          type: 41,
          data: { name: "consume", staticContextId: 3 },
          dataNode: { isNew: true },
        },
        {
          loc: {
            start: { line: 22, column: 19 },
            end: { line: 22, column: 20 },
          },
          _traceId: 7,
          _staticContextId: 4,
          type: 1,
        },
        {
          displayName: "produce",
          loc: {
            start: { line: 22, column: 9 },
            end: { line: 22, column: 16 },
            identifierName: "produce",
          },
          _traceId: 8,
          _staticContextId: 1,
          type: 41,
          data: { name: "produce", staticContextId: 4 },
          dataNode: { isNew: true },
        },
        {
          loc: {
            start: { line: 28, column: 21 },
            end: { line: 28, column: 22 },
          },
          _traceId: 9,
          _staticContextId: 5,
          type: 1,
        },
        {
          loc: {
            start: { line: 29, column: 50 },
            end: { line: 29, column: 51 },
          },
          _traceId: 10,
          _staticContextId: 6,
          type: 1,
        },
        {
          displayName: "n",
          loc: {
            start: { line: 28, column: 18 },
            end: { line: 28, column: 19 },
            identifierName: "n",
          },
          _traceId: 11,
          _staticContextId: 1,
          type: 38,
          dataNode: { isNew: false },
        },
        {
          displayName: "producer",
          loc: {
            start: { line: 28, column: 9 },
            end: { line: 28, column: 17 },
            identifierName: "producer",
          },
          _traceId: 12,
          _staticContextId: 1,
          type: 41,
          data: { name: "producer", staticContextId: 5 },
          dataNode: { isNew: true },
        },
        {
          loc: {
            start: { line: 39, column: 21 },
            end: { line: 39, column: 22 },
          },
          _traceId: 13,
          _staticContextId: 7,
          type: 1,
        },
        {
          loc: {
            start: { line: 41, column: 10 },
            end: { line: 41, column: 10 },
          },
          _traceId: 14,
          _staticContextId: 8,
          type: 1,
        },
        {
          loc: {
            start: { line: 42, column: 28 },
            end: { line: 42, column: 29 },
          },
          _traceId: 15,
          _staticContextId: 9,
          type: 1,
        },
        {
          displayName: "n",
          loc: {
            start: { line: 39, column: 18 },
            end: { line: 39, column: 19 },
            identifierName: "n",
          },
          _traceId: 16,
          _staticContextId: 1,
          type: 38,
          dataNode: { isNew: false },
        },
        {
          displayName: "consumer",
          loc: {
            start: { line: 39, column: 9 },
            end: { line: 39, column: 17 },
            identifierName: "consumer",
          },
          _traceId: 17,
          _staticContextId: 1,
          type: 41,
          data: { name: "consumer", staticContextId: 7 },
          dataNode: { isNew: true },
        },
        {
          displayName: "waitTicksPromise",
          loc: {
            start: { line: 13, column: 9 },
            end: { line: 13, column: 25 },
            identifierName: "waitTicksPromise",
          },
          _traceId: 18,
          _staticContextId: 2,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "IdleTime",
          loc: {
            start: { line: 13, column: 26 },
            end: { line: 13, column: 34 },
            identifierName: "IdleTime",
          },
          _traceId: 19,
          _staticContextId: 2,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(IdleTime)",
          loc: {
            start: { line: 13, column: 9 },
            end: { line: 13, column: 35 },
          },
          _traceId: 20,
          _staticContextId: 2,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }],
            specialType: null,
          },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(IdleTime)",
          loc: {
            start: { line: 13, column: 9 },
            end: { line: 13, column: 35 },
          },
          _traceId: 21,
          _staticContextId: 2,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "return waitTicksPromise(IdleTime);",
          loc: {
            start: { line: 13, column: 2 },
            end: { line: 13, column: 36 },
          },
          _traceId: 22,
          _staticContextId: 2,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 14, column: 1 }, end: { line: 14, column: 1 } },
          _traceId: 23,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "startConsume",
          loc: {
            start: { line: 17, column: 2 },
            end: { line: 17, column: 14 },
            identifierName: "startConsume",
          },
          _traceId: 24,
          _staticContextId: 3,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "startConsume()",
          loc: {
            start: { line: 17, column: 2 },
            end: { line: 17, column: 16 },
          },
          _traceId: 25,
          _staticContextId: 3,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "startConsume()",
          loc: {
            start: { line: 17, column: 2 },
            end: { line: 17, column: 16 },
          },
          _traceId: 26,
          _staticContextId: 3,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "getConsumeTime",
          loc: {
            start: { line: 18, column: 26 },
            end: { line: 18, column: 40 },
            identifierName: "getConsumeTime",
          },
          _traceId: 27,
          _staticContextId: 3,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "getConsumeTime()",
          loc: {
            start: { line: 18, column: 26 },
            end: { line: 18, column: 42 },
          },
          _traceId: 28,
          _staticContextId: 3,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "getConsumeTime()",
          loc: {
            start: { line: 18, column: 26 },
            end: { line: 18, column: 42 },
          },
          _traceId: 29,
          _staticContextId: 3,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "waitTicksPromise",
          loc: {
            start: { line: 18, column: 9 },
            end: { line: 18, column: 25 },
            identifierName: "waitTicksPromise",
          },
          _traceId: 30,
          _staticContextId: 3,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(getConsumeTime())",
          loc: {
            start: { line: 18, column: 9 },
            end: { line: 18, column: 43 },
          },
          _traceId: 31,
          _staticContextId: 3,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }],
            specialType: null,
          },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(getConsumeTime())",
          loc: {
            start: { line: 18, column: 9 },
            end: { line: 18, column: 43 },
          },
          _traceId: 32,
          _staticContextId: 3,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "finishConsume",
          loc: {
            start: { line: 19, column: 10 },
            end: { line: 19, column: 23 },
            identifierName: "finishConsume",
          },
          _traceId: 33,
          _staticContextId: 3,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "waitTicksPromise(getConsumeTime())\n    .then(finishConsume)",
          loc: {
            start: { line: 18, column: 9 },
            end: { line: 19, column: 24 },
          },
          _traceId: 34,
          _staticContextId: 3,
          type: 4,
          data: { isNew: false, argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "waitTicksPromise(getConsumeTime())\n    .then(finishConsume)",
          loc: {
            start: { line: 18, column: 9 },
            end: { line: 19, column: 24 },
          },
          _traceId: 35,
          _staticContextId: 3,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "waitTicksPromise(getConsumeTime())\n    .then",
          loc: { start: { line: 18, column: 9 }, end: { line: 19, column: 9 } },
          _traceId: 36,
          _staticContextId: 3,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName:
            "return waitTicksPromise(getConsumeTime())\n    .then(finishConsume);",
          loc: {
            start: { line: 18, column: 2 },
            end: { line: 19, column: 25 },
          },
          _traceId: 37,
          _staticContextId: 3,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 20, column: 1 }, end: { line: 20, column: 1 } },
          _traceId: 38,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "startProduce",
          loc: {
            start: { line: 23, column: 2 },
            end: { line: 23, column: 14 },
            identifierName: "startProduce",
          },
          _traceId: 39,
          _staticContextId: 4,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "startProduce()",
          loc: {
            start: { line: 23, column: 2 },
            end: { line: 23, column: 16 },
          },
          _traceId: 40,
          _staticContextId: 4,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "startProduce()",
          loc: {
            start: { line: 23, column: 2 },
            end: { line: 23, column: 16 },
          },
          _traceId: 41,
          _staticContextId: 4,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "getProduceTime",
          loc: {
            start: { line: 24, column: 26 },
            end: { line: 24, column: 40 },
            identifierName: "getProduceTime",
          },
          _traceId: 42,
          _staticContextId: 4,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "getProduceTime()",
          loc: {
            start: { line: 24, column: 26 },
            end: { line: 24, column: 42 },
          },
          _traceId: 43,
          _staticContextId: 4,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "getProduceTime()",
          loc: {
            start: { line: 24, column: 26 },
            end: { line: 24, column: 42 },
          },
          _traceId: 44,
          _staticContextId: 4,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "waitTicksPromise",
          loc: {
            start: { line: 24, column: 9 },
            end: { line: 24, column: 25 },
            identifierName: "waitTicksPromise",
          },
          _traceId: 45,
          _staticContextId: 4,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(getProduceTime())",
          loc: {
            start: { line: 24, column: 9 },
            end: { line: 24, column: 43 },
          },
          _traceId: 46,
          _staticContextId: 4,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }],
            specialType: null,
          },
          dataNode: { isNew: false },
        },
        {
          displayName: "waitTicksPromise(getProduceTime())",
          loc: {
            start: { line: 24, column: 9 },
            end: { line: 24, column: 43 },
          },
          _traceId: 47,
          _staticContextId: 4,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "finishProduce",
          loc: {
            start: { line: 25, column: 10 },
            end: { line: 25, column: 23 },
            identifierName: "finishProduce",
          },
          _traceId: 48,
          _staticContextId: 4,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "waitTicksPromise(getProduceTime())\n    .then(finishProduce)",
          loc: {
            start: { line: 24, column: 9 },
            end: { line: 25, column: 24 },
          },
          _traceId: 49,
          _staticContextId: 4,
          type: 4,
          data: { isNew: false, argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "waitTicksPromise(getProduceTime())\n    .then(finishProduce)",
          loc: {
            start: { line: 24, column: 9 },
            end: { line: 25, column: 24 },
          },
          _traceId: 50,
          _staticContextId: 4,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "waitTicksPromise(getProduceTime())\n    .then",
          loc: { start: { line: 24, column: 9 }, end: { line: 25, column: 9 } },
          _traceId: 51,
          _staticContextId: 4,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName:
            "return waitTicksPromise(getProduceTime())\n    .then(finishProduce);",
          loc: {
            start: { line: 24, column: 2 },
            end: { line: 25, column: 25 },
          },
          _traceId: 52,
          _staticContextId: 4,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 26, column: 1 }, end: { line: 26, column: 1 } },
          _traceId: 53,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "hasSpace",
          loc: {
            start: { line: 30, column: 8 },
            end: { line: 30, column: 16 },
            identifierName: "hasSpace",
          },
          _traceId: 54,
          _staticContextId: 6,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "hasSpace()",
          loc: {
            start: { line: 30, column: 8 },
            end: { line: 30, column: 18 },
          },
          _traceId: 55,
          _staticContextId: 6,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "hasSpace()",
          loc: {
            start: { line: 30, column: 8 },
            end: { line: 30, column: 18 },
          },
          _traceId: 56,
          _staticContextId: 6,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "produce",
          loc: {
            start: { line: 31, column: 13 },
            end: { line: 31, column: 20 },
            identifierName: "produce",
          },
          _traceId: 57,
          _staticContextId: 6,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "produce()",
          loc: {
            start: { line: 31, column: 13 },
            end: { line: 31, column: 22 },
          },
          _traceId: 58,
          _staticContextId: 6,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "produce()",
          loc: {
            start: { line: 31, column: 13 },
            end: { line: 31, column: 22 },
          },
          _traceId: 59,
          _staticContextId: 6,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "return produce();",
          loc: {
            start: { line: 31, column: 6 },
            end: { line: 31, column: 23 },
          },
          _traceId: 60,
          _staticContextId: 6,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          displayName: "idle",
          loc: {
            start: { line: 34, column: 13 },
            end: { line: 34, column: 17 },
            identifierName: "idle",
          },
          _traceId: 61,
          _staticContextId: 6,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "idle()",
          loc: {
            start: { line: 34, column: 13 },
            end: { line: 34, column: 19 },
          },
          _traceId: 62,
          _staticContextId: 6,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "idle()",
          loc: {
            start: { line: 34, column: 13 },
            end: { line: 34, column: 19 },
          },
          _traceId: 63,
          _staticContextId: 6,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "return idle();",
          loc: {
            start: { line: 34, column: 6 },
            end: { line: 34, column: 20 },
          },
          _traceId: 64,
          _staticContextId: 6,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 36, column: 3 }, end: { line: 36, column: 3 } },
          _traceId: 65,
          _staticContextId: 5,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "producerTick",
          loc: {
            start: { line: 29, column: 35 },
            end: { line: 29, column: 47 },
            identifierName: "producerTick",
          },
          _traceId: 66,
          _staticContextId: 5,
          type: 41,
          data: { name: "producerTick", staticContextId: 6 },
          dataNode: { isNew: true },
        },
        {
          displayName: "repeatPromise",
          loc: {
            start: { line: 29, column: 9 },
            end: { line: 29, column: 22 },
            identifierName: "repeatPromise",
          },
          _traceId: 67,
          _staticContextId: 5,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "n",
          loc: {
            start: { line: 29, column: 23 },
            end: { line: 29, column: 24 },
            identifierName: "n",
          },
          _traceId: 68,
          _staticContextId: 5,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "repeatPromise(n, function producerTick() {\n    if (hasSpace()) {\n      return produce();\n    }\n    else {\n      return idle();\n    }\n  })",
          loc: { start: { line: 29, column: 9 }, end: { line: 36, column: 4 } },
          _traceId: 69,
          _staticContextId: 5,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }, { isSpread: false }],
            specialType: null,
          },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "repeatPromise(n, function producerTick() {\n    if (hasSpace()) {\n      return produce();\n    }\n    else {\n      return idle();\n    }\n  })",
          loc: { start: { line: 29, column: 9 }, end: { line: 36, column: 4 } },
          _traceId: 70,
          _staticContextId: 5,
          type: 6,
          dataNode: {},
        },
        {
          displayName:
            "return repeatPromise(n, function producerTick() {\n    if (hasSpace()) {\n      return produce();\n    }\n    else {\n      return idle();\n    }\n  });",
          loc: { start: { line: 29, column: 2 }, end: { line: 36, column: 5 } },
          _traceId: 71,
          _staticContextId: 5,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 37, column: 1 }, end: { line: 37, column: 1 } },
          _traceId: 72,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "!n",
          loc: {
            start: { line: 41, column: 11 },
            end: { line: 41, column: 13 },
          },
          _traceId: 73,
          _staticContextId: 8,
          type: 7,
          dataNode: { isNew: true },
        },
        {
          displayName: "!!n",
          loc: {
            start: { line: 41, column: 10 },
            end: { line: 41, column: 13 },
          },
          _traceId: 74,
          _staticContextId: 8,
          type: 7,
          dataNode: { isNew: true },
        },
        {
          loc: {
            start: { line: 41, column: 13 },
            end: { line: 41, column: 13 },
          },
          _traceId: 75,
          _staticContextId: 7,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "!!n",
          loc: {
            start: { line: 41, column: 10 },
            end: { line: 41, column: 13 },
          },
          _traceId: 76,
          _staticContextId: 8,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          displayName: "[cb] repeatPromise",
          loc: {
            start: { line: 41, column: 4 },
            end: { line: 41, column: 13 },
          },
          _traceId: 77,
          _staticContextId: 7,
          type: 42,
          data: { staticContextId: 8 },
          dataNode: { isNew: true },
        },
        {
          displayName: "hasItems",
          loc: {
            start: { line: 43, column: 10 },
            end: { line: 43, column: 18 },
            identifierName: "hasItems",
          },
          _traceId: 78,
          _staticContextId: 9,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "hasItems()",
          loc: {
            start: { line: 43, column: 10 },
            end: { line: 43, column: 20 },
          },
          _traceId: 79,
          _staticContextId: 9,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "hasItems()",
          loc: {
            start: { line: 43, column: 10 },
            end: { line: 43, column: 20 },
          },
          _traceId: 80,
          _staticContextId: 9,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "n",
          loc: {
            start: { line: 44, column: 10 },
            end: { line: 44, column: 11 },
            identifierName: "n",
          },
          _traceId: 81,
          _staticContextId: 9,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "--n",
          loc: {
            start: { line: 44, column: 8 },
            end: { line: 44, column: 11 },
          },
          _traceId: 82,
          _staticContextId: 9,
          type: 34,
          dataNode: { isNew: true },
        },
        {
          displayName: "'cons'",
          loc: {
            start: { line: 45, column: 20 },
            end: { line: 45, column: 26 },
          },
          _traceId: 83,
          _staticContextId: 9,
          type: 36,
          dataNode: { isNew: true },
        },
        {
          displayName: "n",
          loc: {
            start: { line: 45, column: 28 },
            end: { line: 45, column: 29 },
            identifierName: "n",
          },
          _traceId: 84,
          _staticContextId: 9,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log('cons', n)",
          loc: {
            start: { line: 45, column: 8 },
            end: { line: 45, column: 30 },
          },
          _traceId: 85,
          _staticContextId: 9,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }, { isSpread: false }],
          },
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log('cons', n)",
          loc: {
            start: { line: 45, column: 8 },
            end: { line: 45, column: 30 },
          },
          _traceId: 86,
          _staticContextId: 9,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "console",
          loc: {
            start: { line: 45, column: 8 },
            end: { line: 45, column: 15 },
            identifierName: "console",
          },
          _traceId: 87,
          _staticContextId: 9,
          type: 35,
          data: {},
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log",
          loc: {
            start: { line: 45, column: 8 },
            end: { line: 45, column: 19 },
          },
          _traceId: 88,
          _staticContextId: 9,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "consume",
          loc: {
            start: { line: 46, column: 15 },
            end: { line: 46, column: 22 },
            identifierName: "consume",
          },
          _traceId: 89,
          _staticContextId: 9,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "consume()",
          loc: {
            start: { line: 46, column: 15 },
            end: { line: 46, column: 24 },
          },
          _traceId: 90,
          _staticContextId: 9,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "consume()",
          loc: {
            start: { line: 46, column: 15 },
            end: { line: 46, column: 24 },
          },
          _traceId: 91,
          _staticContextId: 9,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "return consume();",
          loc: {
            start: { line: 46, column: 8 },
            end: { line: 46, column: 25 },
          },
          _traceId: 92,
          _staticContextId: 9,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          displayName: "'cons idle'",
          loc: {
            start: { line: 49, column: 20 },
            end: { line: 49, column: 31 },
          },
          _traceId: 93,
          _staticContextId: 9,
          type: 36,
          dataNode: { isNew: true },
        },
        {
          displayName: "n",
          loc: {
            start: { line: 49, column: 33 },
            end: { line: 49, column: 34 },
            identifierName: "n",
          },
          _traceId: 94,
          _staticContextId: 9,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log('cons idle', n)",
          loc: {
            start: { line: 49, column: 8 },
            end: { line: 49, column: 35 },
          },
          _traceId: 95,
          _staticContextId: 9,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }, { isSpread: false }],
          },
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log('cons idle', n)",
          loc: {
            start: { line: 49, column: 8 },
            end: { line: 49, column: 35 },
          },
          _traceId: 96,
          _staticContextId: 9,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "console",
          loc: {
            start: { line: 49, column: 8 },
            end: { line: 49, column: 15 },
            identifierName: "console",
          },
          _traceId: 97,
          _staticContextId: 9,
          type: 35,
          data: {},
          dataNode: { isNew: false },
        },
        {
          displayName: "console.log",
          loc: {
            start: { line: 49, column: 8 },
            end: { line: 49, column: 19 },
          },
          _traceId: 98,
          _staticContextId: 9,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "idle",
          loc: {
            start: { line: 50, column: 15 },
            end: { line: 50, column: 19 },
            identifierName: "idle",
          },
          _traceId: 99,
          _staticContextId: 9,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "idle()",
          loc: {
            start: { line: 50, column: 15 },
            end: { line: 50, column: 21 },
          },
          _traceId: 100,
          _staticContextId: 9,
          type: 4,
          data: { isNew: false, argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "idle()",
          loc: {
            start: { line: 50, column: 15 },
            end: { line: 50, column: 21 },
          },
          _traceId: 101,
          _staticContextId: 9,
          type: 6,
          dataNode: {},
        },
        {
          displayName: "return idle();",
          loc: {
            start: { line: 50, column: 8 },
            end: { line: 50, column: 22 },
          },
          _traceId: 102,
          _staticContextId: 9,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 52, column: 5 }, end: { line: 52, column: 5 } },
          _traceId: 103,
          _staticContextId: 7,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "consumerTick",
          loc: {
            start: { line: 42, column: 13 },
            end: { line: 42, column: 25 },
            identifierName: "consumerTick",
          },
          _traceId: 104,
          _staticContextId: 7,
          type: 41,
          data: { name: "consumerTick", staticContextId: 9 },
          dataNode: { isNew: true },
        },
        {
          displayName: "repeatPromise",
          loc: {
            start: { line: 40, column: 9 },
            end: { line: 40, column: 22 },
            identifierName: "repeatPromise",
          },
          _traceId: 105,
          _staticContextId: 7,
          type: 35,
          data: { specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "repeatPromise(\n    () => !!n,\n    function consumerTick() {\n      if (hasItems()) {\n        --n;\n        console.log('cons', n);\n        return consume();\n      }\n      else {\n        console.log('cons idle', n);\n        return idle();\n      }\n    }\n  )",
          loc: { start: { line: 40, column: 9 }, end: { line: 53, column: 3 } },
          _traceId: 106,
          _staticContextId: 7,
          type: 4,
          data: {
            isNew: false,
            argConfigs: [{ isSpread: false }, { isSpread: false }],
            specialType: null,
          },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "repeatPromise(\n    () => !!n,\n    function consumerTick() {\n      if (hasItems()) {\n        --n;\n        console.log('cons', n);\n        return consume();\n      }\n      else {\n        console.log('cons idle', n);\n        return idle();\n      }\n    }\n  )",
          loc: { start: { line: 40, column: 9 }, end: { line: 53, column: 3 } },
          _traceId: 107,
          _staticContextId: 7,
          type: 6,
          dataNode: {},
        },
        {
          displayName:
            "return repeatPromise(\n    () => !!n,\n    function consumerTick() {\n      if (hasItems()) {\n        --n;\n        console.log('cons', n);\n        return consume();\n      }\n      else {\n        console.log('cons idle', n);\n        return idle();\n      }\n    }\n  );",
          loc: { start: { line: 40, column: 2 }, end: { line: 53, column: 4 } },
          _traceId: 108,
          _staticContextId: 7,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 54, column: 1 }, end: { line: 54, column: 1 } },
          _traceId: 109,
          _staticContextId: 1,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 36, column: 3 }, end: { line: 36, column: 3 } },
          _traceId: 110,
          _staticContextId: 5,
          type: 22,
        },
        {
          loc: { start: { line: 52, column: 5 }, end: { line: 52, column: 5 } },
          _traceId: 111,
          _staticContextId: 7,
          type: 22,
        },
        {
          loc: {
            start: { line: 64, column: 14 },
            end: { line: 64, column: 15 },
          },
          _traceId: 112,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiaWRsZSIsImNvbnN1bWUiLCJwcm9kdWNlIiwicHJvZHVjZXIiLCJjb25zdW1lciIsIndhaXRUaWNrc1Byb21pc2UiLCJJZGxlVGltZSIsImdldENvbnN1bWVUaW1lIiwidGhlbiIsImZpbmlzaENvbnN1bWUiLCJnZXRQcm9kdWNlVGltZSIsImZpbmlzaFByb2R1Y2UiLCJuIiwicmVwZWF0UHJvbWlzZSIsInByb2R1Y2VyVGljayIsImhhc1NwYWNlIiwiY29uc3VtZXJUaWNrIiwiaGFzSXRlbXMiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiYUFBQTtBQUNBLHNDOzs7Ozs7QUFNU0EsRUFBQUEsSTs7Ozs7Ozs7QUFRQUMsRUFBQUEsTzs7Ozs7O0FBTUFDLEVBQUFBLE87Ozs7OztBQU1BQyxFQUFBQSxROzs7Ozs7Ozs7OztBQVdBQyxFQUFBQSxRLEdBbkNUO0FBQ0E7QUFDQSxpRkFFQSxTQUFTSixJQUFULDBDQUFnQixnRkFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUFPSywyQkFBUCwwQ0FBd0JDLGdDQUF4Qix3SEFBTywyQkFBUCx3REFDRCxDQU5ELDBCQVFBLFNBQVNMLE9BQVQsMkNBQW1CLG1PQUNqQiwyTkFDQSw0Q0FBT0ksMkJBQVAsOERBQXdCRSxzQ0FBeEIsNEhBQXdCLGlCQUF4Qiw0SEFBTyw2QkFBUCx5RUFDR0MsSUFESCwyQ0FDUUMscUNBRFIsaUlBQU8seUNBQVAsd0RBRUQsQ0FKRCwyQkFNQSxTQUFTUCxPQUFULDJDQUFtQixxT0FDakIsMk5BQ0EsNkNBQU9HLDJCQUFQLDhEQUF3Qkssc0NBQXhCLDRIQUF3QixpQkFBeEIsNEhBQU8sNkJBQVAsNEVBQ0dGLElBREgsMkNBQ1FHLHFDQURSLG1JQUFPLDJDQUFQLHdEQUVELENBSkQsMkJBTUEsU0FBU1IsUUFBVCxDQUFrQlMsQ0FBbEIsMkNBQXFCLGtHQUFIQSxDQUFHLGNBQ25CLGtDQUFPQyx3QkFBUCw0Q0FBcUJELENBQXJCLGdDQUF3QixTQUFTRSxZQUFULDZDQUF3QiwyREFDOUMscUJBQUlDLGdDQUFKLGtIQUFJLFdBQUosNEJBQWdCLG1EQUNkLDRCQUFPYixPQUFQLCtHQUFPLFVBQVAsd0RBQ0QsQ0FGRCxNQUdLLGdEQUNILHlCQUFPRixJQUFQLHlHQUFPLE9BQVAsd0RBQ0QsQ0FONkMsYUFPL0MsQ0FQdUIsMkJBQXhCLDBIQUFPLHNDQUFQLHdEQVFELENBVEQsMkJBV0EsU0FBU0ksUUFBVCxDQUFrQlEsQ0FBbEIsNENBQXFCLHlHQUFIQSxDQUFHLGNBQ25CLG1DQUFPQyx3QkFBUCw4Q0FDRSxzR0FBTSxLQUFDLENBQUNELENBQUYsdUJBQU4scUZBREYsK0JBRUUsU0FBU0ksWUFBVCw4Q0FBd0Isc0VBQ3RCLHFCQUFJQyxnQ0FBSixrSEFBSSxXQUFKLDRCQUFnQixzSUFDZCxLQUFFTCxDQUFGLGFBQUVBLENBQUYsa0NBQUVBLENBQUYsdUNBQ0EsV0FBQU0sT0FBTywwQkFBUCxzQ0FBUUMsR0FBUiwyQ0FBWSxNQUFaLGdDQUFvQlAsQ0FBcEI7QUFDQSx3Q0FBT1gsT0FBUCwrR0FBTyxVQUFQO0FBQ0QsV0FKRDtBQUtLO0FBQ0gsdUJBQUFpQixPQUFPLDBCQUFQLHVDQUFRQyxHQUFSLDJDQUFZLFdBQVosZ0NBQXlCUCxDQUF6QjtBQUNBLHNDQUFPWixJQUFQLDZHQUFPLFFBQVA7QUFDRCxXQVRxQjtBQVV2QixTQVZELDRCQUZGLGtJQUFPLHVDQUFQOztBQWNELEtBZkQ7O0FBaUJBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSWRsZVRpbWUsIE4sIHN0YXJ0UHJvZHVjZSwgZmluaXNoUHJvZHVjZSwgc3RhcnRDb25zdW1lLCBmaW5pc2hDb25zdW1lLCBoYXNTcGFjZSwgaGFzSXRlbXMsIGdldFByb2R1Y2VUaW1lLCBnZXRDb25zdW1lVGltZSwgfSBmcm9tICcuL3Byb2R1Y2VyX2NvbnN1bWVyX2Jhc2UnO1xyXG5pbXBvcnQgeyB3YWl0VGlja3NQcm9taXNlLCByZXBlYXRQcm9taXNlLyogLCBzbGVlcCAqLyB9IGZyb20gJ2FzeW5jVXRpbCc7XHJcblxyXG4vKiogIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXHJcbiAqIEJhc2ljIGZ1bmN0aW9uc1xyXG4gKiAgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyovXHJcblxyXG5mdW5jdGlvbiBpZGxlKCkge1xyXG4gIC8vIHJldHVybiBzbGVlcCgpIC8vIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXNcclxuICAvLyAgIC50aGVuKCgpID0+XHJcbiAgLy8gICAgIHdhaXRUaWNrc1Byb21pc2UoSWRsZVRpbWUpXHJcbiAgLy8gICApO1xyXG4gIHJldHVybiB3YWl0VGlja3NQcm9taXNlKElkbGVUaW1lKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29uc3VtZSgpIHtcclxuICBzdGFydENvbnN1bWUoKTtcclxuICByZXR1cm4gd2FpdFRpY2tzUHJvbWlzZShnZXRDb25zdW1lVGltZSgpKVxyXG4gICAgLnRoZW4oZmluaXNoQ29uc3VtZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2R1Y2UoKSB7XHJcbiAgc3RhcnRQcm9kdWNlKCk7XHJcbiAgcmV0dXJuIHdhaXRUaWNrc1Byb21pc2UoZ2V0UHJvZHVjZVRpbWUoKSlcclxuICAgIC50aGVuKGZpbmlzaFByb2R1Y2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcm9kdWNlcihuKSB7XHJcbiAgcmV0dXJuIHJlcGVhdFByb21pc2UobiwgZnVuY3Rpb24gcHJvZHVjZXJUaWNrKCkge1xyXG4gICAgaWYgKGhhc1NwYWNlKCkpIHtcclxuICAgICAgcmV0dXJuIHByb2R1Y2UoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gaWRsZSgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25zdW1lcihuKSB7XHJcbiAgcmV0dXJuIHJlcGVhdFByb21pc2UoXHJcbiAgICAoKSA9PiAhIW4sXHJcbiAgICBmdW5jdGlvbiBjb25zdW1lclRpY2soKSB7XHJcbiAgICAgIGlmIChoYXNJdGVtcygpKSB7XHJcbiAgICAgICAgLS1uO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjb25zJywgbik7XHJcbiAgICAgICAgcmV0dXJuIGNvbnN1bWUoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnY29ucyBpZGxlJywgbik7XHJcbiAgICAgICAgcmV0dXJuIGlkbGUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICk7XHJcbn1cclxuXHJcbi8qKiAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcclxuICogTWFpblxyXG4gKiAgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyovXHJcblxyXG4vLyBwcm9kdWNlcigyKk4pO1xyXG4vLyBjb25zdW1lcihOKTtcclxuLy8gY29uc3VtZXIoTik7XHJcbi8vIGNvbnN1bWVyKE4pO1xyXG4vLyBwcm9kdWNlcihOKTsiXX0=

