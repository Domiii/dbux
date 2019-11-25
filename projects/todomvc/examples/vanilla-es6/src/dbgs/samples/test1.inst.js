function test1() {
  var a = { x: 1 };
  __dbgs_logObjectTrace(__dbgs_trackObject)(__dbgs_logObjectTrace(a), 'a');
  var c = __dbgs_logObjectTrace(a);
  var b = 3;
  a = { y: 33 };
  function f(arg) {
    __dbgs_logObjectTrace(noop)(__dbgs_logObjectTrace(arg));
  }
  __dbgs_logObjectTrace(noop)(__dbgs_logObjectTrace(a));
}
function noop() {
}
__dbgs_logObjectTrace(test1)();

//# sourceURL=http://localhost:3000/samples/test1.js
//# sourceMappingURL=http://localhost:3000/samples/test1.inst.js.map