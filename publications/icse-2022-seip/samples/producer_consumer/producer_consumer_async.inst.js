"use strict";
var _producer_consumer_base = require("producer_consumer_base");
var _dbux = _dbux_init(
  (typeof __dbux__ !== "undefined" && __dbux__) || require("@dbux/runtime")
);
var _contextId = _dbux.getProgramContextId();
var _al = _dbux.getArgLength,
  _af = _dbux.arrayFrom,
  _uot = _dbux.unitOfType,
  _pI = _dbux.pushImmediate,
  _pF = _dbux.popFunction,
  _par = _dbux.registerParams,
  _tr = _dbux.traceReturn,
  _tt = _dbux.traceThrow,
  _tid = _dbux.newTraceId,
  _td = _dbux.traceDeclaration,
  _te = _dbux.traceExpression,
  _tev = _dbux.traceExpressionVar,
  _twv = _dbux.traceWriteVar,
  _tme = _dbux.traceExpressionME,
  _tmeo = _dbux.traceExpressionMEOptional,
  _twme = _dbux.traceWriteME,
  _tdme = _dbux.traceDeleteME,
  _tue = _dbux.traceUpdateExpressionVar,
  _tume = _dbux.traceUpdateExpressionME,
  _bce = _dbux.traceBCE,
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
  var _produce, _t3_, _t4_, _t5_, _args;

  // async function producer(n) {
  //   while (n--) {
  //     // if (hasSpace()) {
  //       await produce();
  //     // }
  //     // else {
  //     //   await idle();
  //     // }
  //   }
  // }
  (_produce = _tev(_producer_consumer_base.produce, (_t3_ = _tid(3)), _t3_)),
    (_args = []),
    _bce((_t4_ = _tid(4)), _t3_, [], []),
    _tcr(_produce(), (_t5_ = _tid(5)), _t4_);

  // async function producer(n) {
  //   while (n--) {
  //     // if (hasSpace()) {
  //       await produce();
  //     // }
  //     // else {
  //     //   await idle();
  //     // }
  //   }
  // }

  // async function consumer(n) {
  //   while (n--) {
  //     if (hasItems()) {
  //       await consume();
  //     }
  //     else {
  //       await idle();
  //     }
  //   }
  // }

  // // main: start all producers + consumers
  // producer(N);
  // producer(N);
  // consumer(N);
  // consumer(N);
  _dbux.t(6);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "producer_consumer_async.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\case-studies\\async\\producer_consumer\\producer_consumer_async.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 41, column: 15 } },
          type: 1,
          name: "producer_consumer_async.js",
          displayName: "producer_consumer_async.js",
          fileName: "producer_consumer_async.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\case-studies\\async\\producer_consumer\\producer_consumer_async.js",
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
            start: { line: 41, column: 14 },
            end: { line: 41, column: 15 },
          },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          displayName: "produce",
          loc: {
            start: { line: 13, column: 0 },
            end: { line: 13, column: 7 },
            identifierName: "produce",
          },
          _traceId: 3,
          _staticContextId: 1,
          type: 35,
          data: {},
          dataNode: { isNew: false },
        },
        {
          displayName: "produce()",
          loc: { start: { line: 13, column: 0 }, end: { line: 13, column: 9 } },
          _traceId: 4,
          _staticContextId: 1,
          type: 4,
          data: { argConfigs: [], specialType: null },
          dataNode: { isNew: false },
        },
        {
          displayName: "produce()",
          loc: { start: { line: 13, column: 0 }, end: { line: 13, column: 9 } },
          _traceId: 5,
          _staticContextId: 1,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          loc: {
            start: { line: 41, column: 14 },
            end: { line: 41, column: 15 },
          },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImFBQUEsZ0U7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaGFzU3BhY2UsIHByb2R1Y2UsIGhhc0l0ZW1zLCBjb25zdW1lLCBpZGxlLCBOIH0gZnJvbSAncHJvZHVjZXJfY29uc3VtZXJfYmFzZSc7XHJcblxyXG4vLyBhc3luYyBmdW5jdGlvbiBwcm9kdWNlcihuKSB7XHJcbi8vICAgd2hpbGUgKG4tLSkge1xyXG4vLyAgICAgLy8gaWYgKGhhc1NwYWNlKCkpIHtcclxuLy8gICAgICAgYXdhaXQgcHJvZHVjZSgpO1xyXG4vLyAgICAgLy8gfVxyXG4vLyAgICAgLy8gZWxzZSB7XHJcbi8vICAgICAvLyAgIGF3YWl0IGlkbGUoKTtcclxuLy8gICAgIC8vIH1cclxuLy8gICB9XHJcbi8vIH1cclxucHJvZHVjZSgpO1xyXG5cclxuLy8gYXN5bmMgZnVuY3Rpb24gcHJvZHVjZXIobikge1xyXG4vLyAgIHdoaWxlIChuLS0pIHtcclxuLy8gICAgIC8vIGlmIChoYXNTcGFjZSgpKSB7XHJcbi8vICAgICAgIGF3YWl0IHByb2R1Y2UoKTtcclxuLy8gICAgIC8vIH1cclxuLy8gICAgIC8vIGVsc2Uge1xyXG4vLyAgICAgLy8gICBhd2FpdCBpZGxlKCk7XHJcbi8vICAgICAvLyB9XHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBhc3luYyBmdW5jdGlvbiBjb25zdW1lcihuKSB7XHJcbi8vICAgd2hpbGUgKG4tLSkge1xyXG4vLyAgICAgaWYgKGhhc0l0ZW1zKCkpIHtcclxuLy8gICAgICAgYXdhaXQgY29uc3VtZSgpO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgZWxzZSB7XHJcbi8vICAgICAgIGF3YWl0IGlkbGUoKTtcclxuLy8gICAgIH1cclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbi8vIC8vIG1haW46IHN0YXJ0IGFsbCBwcm9kdWNlcnMgKyBjb25zdW1lcnNcclxuLy8gcHJvZHVjZXIoTik7XHJcbi8vIHByb2R1Y2VyKE4pO1xyXG4vLyBjb25zdW1lcihOKTtcclxuLy8gY29uc3VtZXIoTik7Il19

