function test1() {
  var a = { x: 1 };
  __dbux_logObjectTrace(__dbux_trackObject)(__dbux_logObjectTrace(a), 'a');
  var c = __dbux_logObjectTrace(a);
  var b = 3;
  a = { y: 33 };
  function f(arg) {
    __dbux_logObjectTrace(noop)(__dbux_logObjectTrace(arg));
  }
  __dbux_logObjectTrace(noop)(__dbux_logObjectTrace(a));
}
function noop() {
}
__dbux_logObjectTrace(test1)();

//# sourceURL=http://localhost:3000/samples/test1.js
//# sourceMappingURL=http://localhost:3000/samples/test1.inst.js.map