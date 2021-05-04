var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
try {
  // FunctionDeclaration
  function f() {
    var _contextId2 = _dbux.pushImmediate(2, 4, false);
    try {
      return f;
    } finally {
      _dbux.popFunction(_contextId2, 5);
    }
  }
  f();

  // // FunctionExpression
  // const g = function g() { return g; };
  // const g2 = function g2() { return g2; };
  // // const g3 = (null, function g3() { })
  // class B {
  //   // NOTE: same as `A::i`; we keep (i) bindings and (ii) function name
  //   h = (function h() { return this.h; }.bind(this));
  // }
  // const p = {
  //   // NOTE: same as `o.j`; we keep (i) bindings and (ii) function name (unlike `{ g: () => { } }`!)
  //   k: (() => (function k() { return this.k; }.bind(this)))
  // };

  // // ArrowFunctionExpression
  // const h = () => { return h; };

  // // ClassMethod
  // class A {
  //   i() { return this.i; }
  // }

  // // ObjectMethod
  // const o = {
  //   j() { return o.j; }
  // };

  // [
  // f(),
  // g(), new B().h(), p.k(),
  // h(),
  // new A().i(),
  // o.j()
  // ].forEach((res, i) => {
  //   console.log(i, res.name);
  // });
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
          loc: { start: { line: 1, column: 0 }, end: { line: 41, column: 0 } },
          type: 1,
          name: "__unnamed_script_1.js",
          displayName: "__unnamed_script_1.js",
          fileName: "__unnamed_script_1.js",
          filePath: "__unnamed_script_1.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 3, column: 0 }, end: { line: 3, column: 26 } },
          type: 2,
          name: "f",
          displayName: "f",
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
          loc: { start: { line: 41, column: 0 }, end: { line: 41, column: 0 } },
          _callId: false,
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 41, column: 0 }, end: { line: 41, column: 0 } },
          _callId: false,
          _traceId: 3,
          _staticContextId: 1,
          type: 22,
        },
        {
          loc: { start: { line: 3, column: 13 }, end: { line: 3, column: 14 } },
          _callId: false,
          _traceId: 4,
          _staticContextId: 2,
          type: 1,
        },
        {
          loc: { start: { line: 3, column: 25 }, end: { line: 3, column: 26 } },
          _callId: false,
          _traceId: 5,
          _staticContextId: 2,
          type: 2,
        },
      ],
      varAccess: [],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZiJdLCJtYXBwaW5ncyI6IjtBQUNBO0FBQ0EsV0FBU0EsQ0FBVCxHQUFhLHlEQUFFLE9BQU9BLENBQVAsQ0FBVyxDQUFiLDZDQUFhO0FBQzFCQSxFQUFBQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNGO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vLyBGdW5jdGlvbkRlY2xhcmF0aW9uXHJcbmZ1bmN0aW9uIGYoKSB7IHJldHVybiBmOyB9O1xyXG5mKClcclxuXHJcbi8vIC8vIEZ1bmN0aW9uRXhwcmVzc2lvblxyXG4vLyBjb25zdCBnID0gZnVuY3Rpb24gZygpIHsgcmV0dXJuIGc7IH07XHJcbi8vIGNvbnN0IGcyID0gZnVuY3Rpb24gZzIoKSB7IHJldHVybiBnMjsgfTtcclxuLy8gLy8gY29uc3QgZzMgPSAobnVsbCwgZnVuY3Rpb24gZzMoKSB7IH0pXHJcbi8vIGNsYXNzIEIge1xyXG4vLyAgIC8vIE5PVEU6IHNhbWUgYXMgYEE6OmlgOyB3ZSBrZWVwIChpKSBiaW5kaW5ncyBhbmQgKGlpKSBmdW5jdGlvbiBuYW1lXHJcbi8vICAgaCA9IChmdW5jdGlvbiBoKCkgeyByZXR1cm4gdGhpcy5oOyB9LmJpbmQodGhpcykpO1xyXG4vLyB9XHJcbi8vIGNvbnN0IHAgPSB7IFxyXG4vLyAgIC8vIE5PVEU6IHNhbWUgYXMgYG8uamA7IHdlIGtlZXAgKGkpIGJpbmRpbmdzIGFuZCAoaWkpIGZ1bmN0aW9uIG5hbWUgKHVubGlrZSBgeyBnOiAoKSA9PiB7IH0gfWAhKVxyXG4vLyAgIGs6ICgoKSA9PiAoZnVuY3Rpb24gaygpIHsgcmV0dXJuIHRoaXMuazsgfS5iaW5kKHRoaXMpKSlcclxuLy8gfTtcclxuXHJcbi8vIC8vIEFycm93RnVuY3Rpb25FeHByZXNzaW9uXHJcbi8vIGNvbnN0IGggPSAoKSA9PiB7IHJldHVybiBoOyB9O1xyXG5cclxuLy8gLy8gQ2xhc3NNZXRob2RcclxuLy8gY2xhc3MgQSB7XHJcbi8vICAgaSgpIHsgcmV0dXJuIHRoaXMuaTsgfVxyXG4vLyB9XHJcblxyXG4vLyAvLyBPYmplY3RNZXRob2RcclxuLy8gY29uc3QgbyA9IHtcclxuLy8gICBqKCkgeyByZXR1cm4gby5qOyB9XHJcbi8vIH07XHJcblxyXG4vLyBbXHJcbiAgLy8gZigpLFxyXG4gIC8vIGcoKSwgbmV3IEIoKS5oKCksIHAuaygpLFxyXG4gIC8vIGgoKSxcclxuICAvLyBuZXcgQSgpLmkoKSxcclxuICAvLyBvLmooKVxyXG4vLyBdLmZvckVhY2goKHJlcywgaSkgPT4ge1xyXG4vLyAgIGNvbnNvbGUubG9nKGksIHJlcy5uYW1lKTtcclxuLy8gfSk7XHJcbiJdfQ==

