/**
 * @file This sample shows the discreptancy of order of execution between pattern and var lvals.
 */

(() => {
  function l() { console.log('l()'); return 'l'; }
  function r() { console.log('r()'); return { l: 1 }; }
  function x() { console.log('x()'); return 'x'; }
  function o() { console.log('o()'); return _o; }


  var _o = {};
  ({ [l()]: o()[x()] } = r());

  console.log('test1', _o.x);
})();

(() => {
  function r() { console.log('r()'); return 'r'; }
  function x() { console.log('x()'); return 'x'; }
  function o() { console.log('o()'); return _o2; }

  var _o2 = {};
  o()[x()] = r();

  console.log('test2', _o.x);
})();
