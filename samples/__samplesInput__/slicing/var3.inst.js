var _dbux = _dbux_init(
  (typeof __dbux__ !== "undefined" && __dbux__) || require("@dbux/runtime")
);
var _contextId2 = _dbux.getProgramContextId();
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
  _tue = _dbux.traceUpdateExpressionVar,
  _tume = _dbux.traceUpdateExpressionME,
  _bce = _dbux.traceBCE,
  _tcr = _dbux.traceCallResult,
  _tae = _dbux.traceArrayExpression,
  _toe = _dbux.traceObjectExpression,
  _tfi = _dbux.traceForIn;
try {
  var _defineGetter, _t44_, _t45_, _t46_, _t43_, _t47_, _t48_, _args6;
  (_defineGetter = _tev(defineGetter, (_t44_ = _tid(44)), 0)),
    (_args6 = [
      _tev(req, (_t45_ = _tid(45)), 0),
      _te("subdomains", (_t46_ = _tid(46)), null),
      _te(
        function subdomains() {
          var _contextId = _pI(2, 3, false);
          try {
            var _t4_ = _td(4),
              _t5_ = _td(5),
              _t6_ = _td(6);
            _par();
            var _this$app$get,
              _o,
              _isIP,
              _hostname$split,
              _o2,
              _hostname$split$rever,
              _o3,
              _subdomains$slice,
              _o4,
              _t7_,
              _t8_,
              _t9_,
              _t10_,
              _t11_,
              _t12_,
              _t13_,
              _t14_,
              _t18_,
              _t15_,
              _t16_,
              _t17_,
              _args,
              _t19_,
              _t20_,
              _t21_,
              _t22_,
              _t23_,
              _args2,
              _t24_,
              _t28_,
              _t29_,
              _t25_,
              _t26_,
              _t27_,
              _args3,
              _t32_,
              _t30_,
              _t31_,
              _args4,
              _t33_,
              _t34_,
              _t35_,
              _t39_,
              _t40_,
              _t36_,
              _t37_,
              _t38_,
              _args5,
              _t41_,
              _t42_;
            var hostname = _twv(
              _tme(
                _tev(this, (_t7_ = _tid(7)), 0),
                "hostname",
                (_t8_ = _tid(8)),
                _t7_
              ),
              (_t9_ = _tid(9)),
              _t9_,
              [_t8_]
            );

            if (_te(!hostname, (_t10_ = _tid(10)), []))
              return _tr(_tae([], (_t11_ = _tid(11)), []), (_t12_ = _tid(12)), [
                _t11_,
              ]);

            var offset = _twv(
              ((_o = _tme(
                _tev(this, (_t13_ = _tid(13)), 0),
                "app",
                (_t14_ = _tid(14)),
                _t13_
              )),
              (_this$app$get = _tme(_o, "get", (_t18_ = _tid(18)), _t14_)),
              (_args = [_te("subdomain offset", (_t15_ = _tid(15)), null)]),
              _bce((_t16_ = _tid(16)), [_t15_], [null]),
              _tcr(
                _this$app$get.call(_o, _args[0]),
                (_t17_ = _tid(17)),
                _t16_
              )),
              (_t19_ = _tid(19)),
              _t19_,
              [_t17_]
            );
            var subdomains = _twv(
              _te(
                !((_isIP = _tev(isIP, (_t20_ = _tid(20)), 0)),
                (_args2 = [_tev(hostname, (_t21_ = _tid(21)), _t9_)]),
                _bce((_t22_ = _tid(22)), [_t21_], [null]),
                _tcr(_isIP(_args2[0]), (_t23_ = _tid(23)), _t22_)),
                (_t24_ = _tid(24)),
                [_t23_]
              )
                ? ((_o3 =
                    ((_o2 = _tev(hostname, (_t28_ = _tid(28)), _t9_)),
                    (_hostname$split = _tme(
                      _o2,
                      "split",
                      (_t29_ = _tid(29)),
                      _t28_
                    )),
                    (_args3 = [_te(".", (_t25_ = _tid(25)), null)]),
                    _bce((_t26_ = _tid(26)), [_t25_], [null]),
                    _tcr(
                      _hostname$split.call(_o2, _args3[0]),
                      (_t27_ = _tid(27)),
                      _t26_
                    ))),
                  (_hostname$split$rever = _tme(
                    _o3,
                    "reverse",
                    (_t32_ = _tid(32)),
                    _t27_
                  )),
                  (_args4 = []),
                  _bce((_t30_ = _tid(30)), [], []),
                  _tcr(
                    _hostname$split$rever.call(_o3),
                    (_t31_ = _tid(31)),
                    _t30_
                  ))
                : _tae(
                    [_tev(hostname, (_t33_ = _tid(33)), _t9_)],
                    (_t34_ = _tid(34)),
                    [_t33_]
                  ),
              (_t35_ = _tid(35)),
              _t35_,
              []
            );

            return _tr(
              ((_o4 = _tev(subdomains, (_t39_ = _tid(39)), _t6_)),
              (_subdomains$slice = _tme(
                _o4,
                "slice",
                (_t40_ = _tid(40)),
                _t39_
              )),
              (_args5 = [_tev(offset, (_t36_ = _tid(36)), _t19_)]),
              _bce((_t37_ = _tid(37)), [_t36_], [null]),
              _tcr(
                _subdomains$slice.call(_o4, _args5[0]),
                (_t38_ = _tid(38)),
                _t37_
              )),
              (_t41_ = _tid(41)),
              [_t38_]
            );
          } finally {
            _pF(_contextId, (_t42_ = _tid(42)));
          }
        },
        (_t43_ = _tid(43)),
        null
      ),
    ]),
    _bce((_t47_ = _tid(47)), [_t45_, _t46_, _t43_], [null, null, null]),
    _tcr(
      _defineGetter(_args6[0], _args6[1], _args6[2]),
      (_t48_ = _tid(48)),
      _t47_
    );
  _dbux.t(49);
} finally {
  _dbux.popProgram();
}
function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram(
    {
      fileName: "var3.js",
      filePath:
        "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\slicing\\var3.js",
      contexts: [
        {
          _staticId: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 2 } },
          type: 1,
          name: "var3.js",
          displayName: "var3.js",
          fileName: "var3.js",
          filePath:
            "C:\\Users\\domin\\code\\dbux\\samples\\__samplesInput__\\slicing\\var3.js",
        },
        {
          _staticId: 2,
          _parentId: 1,
          loc: { start: { line: 1, column: 32 }, end: { line: 12, column: 1 } },
          type: 2,
          name: "subdomains",
          displayName: "subdomains",
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
          loc: { start: { line: 12, column: 1 }, end: { line: 12, column: 2 } },
          _traceId: 2,
          _staticContextId: 1,
          type: 2,
        },
        {
          loc: { start: { line: 1, column: 54 }, end: { line: 1, column: 55 } },
          _traceId: 3,
          _staticContextId: 2,
          type: 1,
        },
        {
          displayName: "hostname",
          loc: {
            start: { line: 2, column: 6 },
            end: { line: 2, column: 14 },
            identifierName: "hostname",
          },
          _traceId: 4,
          _staticContextId: 2,
          type: 30,
          dataNode: { isNew: true },
        },
        {
          displayName: "offset",
          loc: {
            start: { line: 6, column: 6 },
            end: { line: 6, column: 12 },
            identifierName: "offset",
          },
          _traceId: 5,
          _staticContextId: 2,
          type: 30,
          dataNode: { isNew: true },
        },
        {
          displayName: "subdomains",
          loc: {
            start: { line: 7, column: 6 },
            end: { line: 7, column: 16 },
            identifierName: "subdomains",
          },
          _traceId: 6,
          _staticContextId: 2,
          type: 30,
          dataNode: { isNew: true },
        },
        {
          displayName: "this",
          loc: { start: { line: 2, column: 17 }, end: { line: 2, column: 21 } },
          _traceId: 7,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "this.hostname",
          loc: { start: { line: 2, column: 17 }, end: { line: 2, column: 30 } },
          _traceId: 8,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname = this.hostname",
          loc: { start: { line: 2, column: 6 }, end: { line: 2, column: 30 } },
          _traceId: 9,
          _staticContextId: 2,
          type: 32,
          dataNode: { isNew: false },
        },
        {
          displayName: "!hostname",
          loc: { start: { line: 4, column: 6 }, end: { line: 4, column: 15 } },
          _traceId: 10,
          _staticContextId: 2,
          type: 7,
          dataNode: { isNew: false },
        },
        {
          displayName: "[]",
          loc: { start: { line: 4, column: 24 }, end: { line: 4, column: 26 } },
          _traceId: 11,
          _staticContextId: 2,
          type: 7,
          data: { argConfigs: [] },
          dataNode: { isNew: true },
        },
        {
          displayName: "return [];",
          loc: { start: { line: 4, column: 17 }, end: { line: 4, column: 27 } },
          _traceId: 12,
          _staticContextId: 2,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          displayName: "this",
          loc: { start: { line: 6, column: 15 }, end: { line: 6, column: 19 } },
          _traceId: 13,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "this.app",
          loc: { start: { line: 6, column: 15 }, end: { line: 6, column: 23 } },
          _traceId: 14,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "'subdomain offset'",
          loc: { start: { line: 6, column: 28 }, end: { line: 6, column: 46 } },
          _traceId: 15,
          _staticContextId: 2,
          type: 36,
          dataNode: { isNew: true },
        },
        {
          displayName: "this.app.get('subdomain offset')",
          loc: { start: { line: 6, column: 15 }, end: { line: 6, column: 47 } },
          _traceId: 16,
          _staticContextId: 2,
          type: 4,
          data: { argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName: "this.app.get('subdomain offset')",
          loc: { start: { line: 6, column: 15 }, end: { line: 6, column: 47 } },
          _traceId: 17,
          _staticContextId: 2,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          displayName: "this.app.get",
          loc: { start: { line: 6, column: 15 }, end: { line: 6, column: 27 } },
          _traceId: 18,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "offset = this.app.get('subdomain offset')",
          loc: { start: { line: 6, column: 6 }, end: { line: 6, column: 47 } },
          _traceId: 19,
          _staticContextId: 2,
          type: 32,
          dataNode: { isNew: false },
        },
        {
          displayName: "isIP",
          loc: {
            start: { line: 7, column: 20 },
            end: { line: 7, column: 24 },
            identifierName: "isIP",
          },
          _traceId: 20,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname",
          loc: {
            start: { line: 7, column: 25 },
            end: { line: 7, column: 33 },
            identifierName: "hostname",
          },
          _traceId: 21,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "isIP(hostname)",
          loc: { start: { line: 7, column: 20 }, end: { line: 7, column: 34 } },
          _traceId: 22,
          _staticContextId: 2,
          type: 4,
          data: { argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName: "isIP(hostname)",
          loc: { start: { line: 7, column: 20 }, end: { line: 7, column: 34 } },
          _traceId: 23,
          _staticContextId: 2,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          displayName: "!isIP(hostname)",
          loc: { start: { line: 7, column: 19 }, end: { line: 7, column: 34 } },
          _traceId: 24,
          _staticContextId: 2,
          type: 7,
          dataNode: { isNew: false },
        },
        {
          displayName: "'.'",
          loc: { start: { line: 8, column: 21 }, end: { line: 8, column: 24 } },
          _traceId: 25,
          _staticContextId: 2,
          type: 36,
          dataNode: { isNew: true },
        },
        {
          displayName: "hostname.split('.')",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 25 } },
          _traceId: 26,
          _staticContextId: 2,
          type: 4,
          data: { argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname.split('.')",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 25 } },
          _traceId: 27,
          _staticContextId: 2,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname",
          loc: {
            start: { line: 8, column: 6 },
            end: { line: 8, column: 14 },
            identifierName: "hostname",
          },
          _traceId: 28,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname.split",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 20 } },
          _traceId: 29,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname.split('.').reverse()",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 35 } },
          _traceId: 30,
          _staticContextId: 2,
          type: 4,
          data: { argConfigs: [] },
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname.split('.').reverse()",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 35 } },
          _traceId: 31,
          _staticContextId: 2,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname.split('.').reverse",
          loc: { start: { line: 8, column: 6 }, end: { line: 8, column: 33 } },
          _traceId: 32,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "hostname",
          loc: {
            start: { line: 9, column: 7 },
            end: { line: 9, column: 15 },
            identifierName: "hostname",
          },
          _traceId: 33,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "[hostname]",
          loc: { start: { line: 9, column: 6 }, end: { line: 9, column: 16 } },
          _traceId: 34,
          _staticContextId: 2,
          type: 7,
          data: { argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: true },
        },
        {
          displayName:
            "subdomains = !isIP(hostname)\n    ? hostname.split('.').reverse()\n    : [hostname]",
          loc: { start: { line: 7, column: 6 }, end: { line: 9, column: 16 } },
          _traceId: 35,
          _staticContextId: 2,
          type: 32,
          dataNode: { isNew: false },
        },
        {
          displayName: "offset",
          loc: {
            start: { line: 11, column: 26 },
            end: { line: 11, column: 32 },
            identifierName: "offset",
          },
          _traceId: 36,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "subdomains.slice(offset)",
          loc: {
            start: { line: 11, column: 9 },
            end: { line: 11, column: 33 },
          },
          _traceId: 37,
          _staticContextId: 2,
          type: 4,
          data: { argConfigs: [{ isSpread: false }] },
          dataNode: { isNew: false },
        },
        {
          displayName: "subdomains.slice(offset)",
          loc: {
            start: { line: 11, column: 9 },
            end: { line: 11, column: 33 },
          },
          _traceId: 38,
          _staticContextId: 2,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          displayName: "subdomains",
          loc: {
            start: { line: 11, column: 9 },
            end: { line: 11, column: 19 },
            identifierName: "subdomains",
          },
          _traceId: 39,
          _staticContextId: 2,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "subdomains.slice",
          loc: {
            start: { line: 11, column: 9 },
            end: { line: 11, column: 25 },
          },
          _traceId: 40,
          _staticContextId: 2,
          type: 37,
          dataNode: { isNew: false },
        },
        {
          displayName: "return subdomains.slice(offset);",
          loc: {
            start: { line: 11, column: 2 },
            end: { line: 11, column: 34 },
          },
          _traceId: 41,
          _staticContextId: 2,
          type: 16,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 12, column: 1 }, end: { line: 12, column: 1 } },
          _traceId: 42,
          _staticContextId: 2,
          type: 2,
          dataNode: { isNew: false },
        },
        {
          displayName: "subdomains",
          loc: { start: { line: 1, column: 32 }, end: { line: 12, column: 1 } },
          _traceId: 43,
          _staticContextId: 2,
          type: 7,
          dataNode: { isNew: true },
        },
        {
          displayName: "defineGetter",
          loc: {
            start: { line: 1, column: 0 },
            end: { line: 1, column: 12 },
            identifierName: "defineGetter",
          },
          _traceId: 44,
          _staticContextId: 1,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "req",
          loc: {
            start: { line: 1, column: 13 },
            end: { line: 1, column: 16 },
            identifierName: "req",
          },
          _traceId: 45,
          _staticContextId: 1,
          type: 35,
          dataNode: { isNew: false },
        },
        {
          displayName: "'subdomains'",
          loc: { start: { line: 1, column: 18 }, end: { line: 1, column: 30 } },
          _traceId: 46,
          _staticContextId: 1,
          type: 36,
          dataNode: { isNew: true },
        },
        {
          displayName:
            "defineGetter(req, 'subdomains', function subdomains() {\n  var hostname = this.hostname;\n\n  if (!hostname) return [];\n\n  var offset = this.app.get('subdomain offset');\n  var subdomains = !isIP(hostname)\n    ? hostname.split('.').reverse()\n    : [hostname];\n\n  return subdomains.slice(offset);\n})",
          loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 2 } },
          _traceId: 47,
          _staticContextId: 1,
          type: 4,
          data: {
            argConfigs: [
              { isSpread: false },
              { isSpread: false },
              { isSpread: false },
            ],
          },
          dataNode: { isNew: false },
        },
        {
          displayName:
            "defineGetter(req, 'subdomains', function subdomains() {\n  var hostname = this.hostname;\n\n  if (!hostname) return [];\n\n  var offset = this.app.get('subdomain offset');\n  var subdomains = !isIP(hostname)\n    ? hostname.split('.').reverse()\n    : [hostname];\n\n  return subdomains.slice(offset);\n})",
          loc: { start: { line: 1, column: 0 }, end: { line: 12, column: 2 } },
          _traceId: 48,
          _staticContextId: 1,
          type: 6,
          dataNode: { isNew: false },
        },
        {
          loc: { start: { line: 12, column: 1 }, end: { line: 12, column: 2 } },
          _traceId: 49,
          _staticContextId: 1,
          type: 22,
        },
      ],
      loops: [],
    },
    {}
  );
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVua25vd24iXSwibmFtZXMiOlsiZGVmaW5lR2V0dGVyIiwicmVxIiwic3ViZG9tYWlucyIsImhvc3RuYW1lIiwib2Zmc2V0IiwiaXNJUCJdLCJtYXBwaW5ncyI6InkyQkFBQSxxQkFBQUEsWUFBWSxzQkFBWixpQkFBYUMsR0FBYiw0QkFBa0IsWUFBbEIsK0JBQWdDLFNBQVNDLFVBQVQsMENBQXNCO0FBQ3BELFVBQUlDLFFBQVEsa0JBQUcsSUFBSCxzRkFBWjs7QUFFQSxjQUFJLENBQUNBLFFBQUwseUJBQWU7O0FBRWYsVUFBSUMsTUFBTSx3QkFBRyxJQUFILGdJQUFnQixrQkFBaEIsd0tBQVY7QUFDQSxVQUFJRixVQUFVLFFBQUcsbUJBQUNHLElBQUQsdUNBQU1GLFFBQU47QUFDYkEsTUFBQUEsUUFEYSx3R0FDRSxHQURGO0FBRVpBLE1BQUFBLFFBRlksc0RBQUgsOEJBQWQ7O0FBSUEsNkJBQU9ELFVBQVAsMkdBQXdCRSxNQUF4QjtBQUNELEtBWCtCLDhDQUFoQyw2SyIsInNvdXJjZXNDb250ZW50IjpbImRlZmluZUdldHRlcihyZXEsICdzdWJkb21haW5zJywgZnVuY3Rpb24gc3ViZG9tYWlucygpIHtcclxuICB2YXIgaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lO1xyXG5cclxuICBpZiAoIWhvc3RuYW1lKSByZXR1cm4gW107XHJcblxyXG4gIHZhciBvZmZzZXQgPSB0aGlzLmFwcC5nZXQoJ3N1YmRvbWFpbiBvZmZzZXQnKTtcclxuICB2YXIgc3ViZG9tYWlucyA9ICFpc0lQKGhvc3RuYW1lKVxyXG4gICAgPyBob3N0bmFtZS5zcGxpdCgnLicpLnJldmVyc2UoKVxyXG4gICAgOiBbaG9zdG5hbWVdO1xyXG5cclxuICByZXR1cm4gc3ViZG9tYWlucy5zbGljZShvZmZzZXQpO1xyXG59KSJdfQ==

