[Dbux] linkOwnDependencies {"targetFolder":"c:\\Users\\domin\\code\\dbux\\dbux-cli","dependencyRoot":"C:\\Users\\domin\\code\\dbux"}[39m
[DBUX module-alias] [
  '@babel/core -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\core',
  '@babel/plugin-proposal-class-properties -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-proposal-class-properties',
  '@babel/plugin-proposal-decorators -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-proposal-decorators',
  '@babel/plugin-proposal-function-bind -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-proposal-function-bind',
  '@babel/plugin-proposal-optional-chaining -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-proposal-optional-chaining',
  '@babel/plugin-syntax-dynamic-import -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-syntax-dynamic-import',
  '@babel/plugin-syntax-export-default-from -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-syntax-export-default-from',
  '@babel/plugin-transform-runtime -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\plugin-transform-runtime',
  '@babel/preset-env -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\preset-env',
  '@babel/register -> C:\\Users\\domin\\code\\dbux\\node_modules\\@babel\\register',
  '@dbux/babel-plugin -> C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\babel-plugin',
  '@dbux/common -> C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\common',
  '@dbux/runtime -> C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\runtime',
  'colors -> C:\\Users\\domin\\code\\dbux\\node_modules\\colors',
  'i18next -> C:\\Users\\domin\\code\\dbux\\node_modules\\i18next',
  'lodash -> C:\\Users\\domin\\code\\dbux\\node_modules\\lodash',
  'module-alias -> C:\\Users\\domin\\code\\dbux\\node_modules\\module-alias',
  'object.fromentries -> C:\\Users\\domin\\code\\dbux\\node_modules\\object.fromentries',
  'prettier -> C:\\Users\\domin\\code\\dbux\\node_modules\\prettier',
  'shelljs -> C:\\Users\\domin\\code\\dbux\\node_modules\\shelljs',
  'yargs -> C:\\Users\\domin\\code\\dbux\\node_modules\\yargs',
  'glob -> C:\\Users\\domin\\code\\dbux\\node_modules\\glob',
  '@dbux/cli -> C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\cli'
]
// Instrumenting file c:\Users\domin\code\dbux\samples\__samplesInput__\await0.js...
[Dbux traceVisitors] [v] -> Function.body: {   return new Promise(r => setTimeout(r, ms)); }
[Dbux traceVisitors] [II] -> Function.body: {   return new Promise(r => setTimeout(r, ms)); }
[Dbux traceVisitors] [v] -> ReturnStatement: return new Promise(r => setTimeout(r, ms));
[Dbux traceVisitors] [II] -> ReturnStatement: return new Promise(r => setTimeout(r, ms));
[Dbux traceVisitors] [v] -> ReturnStatement.argument: new Promise(r => setTimeout(r, ms))
[Dbux traceVisitors] [II] -> ReturnStatement.argument: new Promise(r => setTimeout(r, ms))
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _Promise = Promise
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: new _Promise(r => setTimeout(r, ms))
[Dbux traceVisitors] [v] -> AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [II] -> AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [v] <- AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [II] <- AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [v] -> AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [v] <- AssignmentExpression: _Promise = Promise
[Dbux traceVisitors] [v] -> NewExpression: new _Promise(r => setTimeout(r, ms))
[Dbux traceVisitors] [v] -> Function.body: setTimeout(r, ms)
[Dbux traceVisitors] [II] -> Function.body: setTimeout(r, ms)
[Dbux traceVisitors] [v] -> ReturnStatement: return setTimeout(r, ms);
[Dbux traceVisitors] [II] -> ReturnStatement: return setTimeout(r, ms);
[Dbux traceVisitors] [v] -> ReturnStatement.argument: setTimeout(r, ms)
[Dbux traceVisitors] [II] -> ReturnStatement.argument: setTimeout(r, ms)
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _setTimeout = setTimeout
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _setTimeout(r, ms)
[Dbux traceVisitors] [v] -> AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [II] -> AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] <- AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [II] <- AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] -> AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] <- AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] -> CallExpression: _setTimeout(r, ms)
[Dbux traceVisitors] [v] <- CallExpression: _setTimeout(r, ms)
[Dbux traceVisitors] [II] <- CallExpression: _setTimeout(r, ms)
[Dbux traceVisitors] [v] -> CallExpression: _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
[Dbux traceVisitors] [v] <- CallExpression: _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
[Dbux traceVisitors] [v] <- ReturnStatement: return _dbux.traceExpr(12, _setTimeout = setTimeout), _dbux.t(13), _dbux.traceExpr(16, _setTimeou...
[Dbux traceVisitors] [v] <- Function.body: {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _dbux.traceExpr(11, r);    try {     v...
[Dbux traceVisitors] [v] <- NewExpression: new _Promise(r => {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _dbux.traceExpr(11, ...
[Dbux traceVisitors] [II] <- NewExpression: new _Promise(r => {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _dbux.traceExpr(11, ...
[Dbux traceVisitors] [v] -> NewExpression: new _Promise(_dbux.traceArg(18, r => {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _...
[Dbux traceVisitors] [v] -> Function.body: {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _dbux.traceExpr(11, r);    try {     v...
[Dbux traceVisitors] [v] -> ReturnStatement: return _dbux.traceExpr(12, _setTimeout = setTimeout), _dbux.t(13), _dbux.traceExpr(16, _setTimeou...
[Dbux traceVisitors] [v] -> AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] <- AssignmentExpression: _setTimeout = setTimeout
[Dbux traceVisitors] [v] -> CallExpression: _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
[Dbux traceVisitors] [v] <- CallExpression: _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
[Dbux traceVisitors] [v] <- ReturnStatement: return _dbux.traceExpr(12, _setTimeout = setTimeout), _dbux.t(13), _dbux.traceExpr(16, _setTimeou...
[Dbux traceVisitors] [v] <- Function.body: {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _dbux.traceExpr(11, r);    try {     v...
[Dbux traceVisitors] [v] <- NewExpression: new _Promise(_dbux.traceArg(18, r => {   var _contextId3 = _dbux.pushImmediate(4, 9, false);    _...
[Dbux traceVisitors] [v] <- ReturnStatement: return _dbux.traceExpr(8, _Promise = Promise), _dbux.t(17), _dbux.traceExpr(19, new _Promise(_dbu...
[Dbux traceVisitors] [v] <- Function.body: {   var _contextId2 = _dbux.pushImmediate(2, 4, true);    _dbux.pushResume(3, 4);    _dbux.traceE...
[Dbux traceVisitors] [v] -> Function.body: {   console.log(1);   await sleep(800);   console.log(2); // await sleep(800);   // console.log(3...
[Dbux traceVisitors] [II] -> Function.body: {   console.log(1);   await sleep(800);   console.log(2); // await sleep(800);   // console.log(3...
[Dbux traceVisitors] [v] -> ExpressionStatement.expression: console.log(1)
[Dbux traceVisitors] [v] -> CallExpression: console.log(1)
[Dbux traceVisitors] [II] -> CallExpression: console.log(1)
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _o = console
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _func = _o.log
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _func.call(_o, 1)
[Dbux traceVisitors] [v] -> AssignmentExpression: _o = console
[Dbux traceVisitors] [II] -> AssignmentExpression: _o = console
[Dbux traceVisitors] [v] <- AssignmentExpression: _o = console
[Dbux traceVisitors] [II] <- AssignmentExpression: _o = console
[Dbux traceVisitors] [v] -> AssignmentExpression: _o = console
[Dbux traceVisitors] [v] <- AssignmentExpression: _o = console
[Dbux traceVisitors] [v] -> AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [II] -> AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [v] -> MemberExpression.property: log
[Dbux traceVisitors] [II] -> MemberExpression.property: log
[Dbux traceVisitors] [v] <- MemberExpression.property: log
[Dbux traceVisitors] [II] <- MemberExpression.property: log
[Dbux traceVisitors] [v] <- AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [II] <- AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [v] -> AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [v] -> MemberExpression.property: log
[Dbux traceVisitors] [v] <- MemberExpression.property: log
[Dbux traceVisitors] [v] <- AssignmentExpression: _func = _o.log
[Dbux traceVisitors] [v] -> CallExpression: _func.call(_o, 1)
[Dbux traceVisitors] [v] <- CallExpression: _func.call(_o, 1)
[Dbux traceVisitors] [II] <- CallExpression: _func.call(_o, 1)
[Dbux traceVisitors] [v] -> CallExpression: _func.call(_o, _dbux.traceArg(26, 1))
[Dbux traceVisitors] [v] <- CallExpression: _func.call(_o, _dbux.traceArg(26, 1))
[Dbux traceVisitors] [v] -> ExpressionStatement.expression: await sleep(800)
[Dbux traceVisitors] [v] -> AwaitExpression: await sleep(800)
[Dbux traceVisitors] [II] -> AwaitExpression: await sleep(800)
[Dbux traceVisitors] [v] -> AwaitExpression: await _dbux.wrapAwait(sleep(800), _contextId5 = _dbux.preAwait(8, 28))
[Dbux traceVisitors] [v] -> CallExpression: sleep(800)
[Dbux traceVisitors] [II] -> CallExpression: sleep(800)
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _sleep = sleep
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _sleep(800)
[Dbux traceVisitors] [v] -> AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [II] -> AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [v] <- AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [II] <- AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [v] -> AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [v] <- AssignmentExpression: _sleep = sleep
[Dbux traceVisitors] [v] -> CallExpression: _sleep(800)
[Dbux traceVisitors] [v] <- CallExpression: _sleep(800)
[Dbux traceVisitors] [II] <- CallExpression: _sleep(800)
[Dbux traceVisitors] [v] -> CallExpression: _sleep(_dbux.traceArg(32, 800))
[Dbux traceVisitors] [v] <- CallExpression: _sleep(_dbux.traceArg(32, 800))
[Dbux traceVisitors] [v] <- AwaitExpression: await _dbux.wrapAwait((_dbux.traceExpr(30, _sleep = sleep), _dbux.t(31), _dbux.traceExpr(33, _sle...
[Dbux traceVisitors] [II] <- AwaitExpression: await _dbux.wrapAwait((_dbux.traceExpr(30, _sleep = sleep), _dbux.t(31), _dbux.traceExpr(33, _sle...
[Dbux traceVisitors] [v] -> ExpressionStatement.expression: console.log(2)
[Dbux traceVisitors] [v] -> CallExpression: console.log(2)
[Dbux traceVisitors] [II] -> CallExpression: console.log(2)
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _o2 = console
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _func2 = _o2.log
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _func2.call(_o2, 2)
[Dbux traceVisitors] [v] -> AssignmentExpression: _o2 = console
[Dbux traceVisitors] [II] -> AssignmentExpression: _o2 = console
[Dbux traceVisitors] [v] <- AssignmentExpression: _o2 = console
[Dbux traceVisitors] [II] <- AssignmentExpression: _o2 = console
[Dbux traceVisitors] [v] -> AssignmentExpression: _o2 = console
[Dbux traceVisitors] [v] <- AssignmentExpression: _o2 = console
[Dbux traceVisitors] [v] -> AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [II] -> AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [v] -> MemberExpression.property: log
[Dbux traceVisitors] [II] -> MemberExpression.property: log
[Dbux traceVisitors] [v] <- MemberExpression.property: log
[Dbux traceVisitors] [II] <- MemberExpression.property: log
[Dbux traceVisitors] [v] <- AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [II] <- AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [v] -> AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [v] -> MemberExpression.property: log
[Dbux traceVisitors] [v] <- MemberExpression.property: log
[Dbux traceVisitors] [v] <- AssignmentExpression: _func2 = _o2.log
[Dbux traceVisitors] [v] -> CallExpression: _func2.call(_o2, 2)
[Dbux traceVisitors] [v] <- CallExpression: _func2.call(_o2, 2)
[Dbux traceVisitors] [II] <- CallExpression: _func2.call(_o2, 2)
[Dbux traceVisitors] [v] -> CallExpression: _func2.call(_o2, _dbux.traceArg(37, 2))
[Dbux traceVisitors] [v] <- CallExpression: _func2.call(_o2, _dbux.traceArg(37, 2))
[Dbux traceVisitors] [v] <- Function.body: {   var _contextId4 = _dbux.pushImmediate(5, 20, true);    _dbux.pushResume(6, 20);    try {     ...
[Dbux traceVisitors] [v] -> ExpressionStatement.expression: main()
[Dbux traceVisitors] [v] -> CallExpression: main()
[Dbux traceVisitors] [II] -> CallExpression: main()
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _main = main
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _main()
[Dbux traceVisitors] [v] -> AssignmentExpression: _main = main
[Dbux traceVisitors] [II] -> AssignmentExpression: _main = main
[Dbux traceVisitors] [v] <- AssignmentExpression: _main = main
[Dbux traceVisitors] [II] <- AssignmentExpression: _main = main
[Dbux traceVisitors] [v] -> AssignmentExpression: _main = main
[Dbux traceVisitors] [v] <- AssignmentExpression: _main = main
[Dbux traceVisitors] [v] -> CallExpression: _main()
[Dbux traceVisitors] [v] <- CallExpression: _main()
[Dbux traceVisitors] [II] <- CallExpression: _main()
[Dbux traceVisitors] [v] -> CallExpression: _main()
[Dbux traceVisitors] [v] <- CallExpression: _main()
var _dbuxRuntime =
  typeof __dbux__ === "undefined" ? require("@dbux/runtime") : __dbux__;
var _dbux = _dbux_init(_dbuxRuntime);
var _contextId = _dbux.getProgramContextId();
try {
  var _main;
  async function sleep(ms) {
    var _contextId2 = _dbux.pushImmediate(2, 4, true);
    _dbux.pushResume(3, 4);
    _dbux.traceExpr(6, ms);
    try {
      var _Promise;
      return (
        _dbux.traceExpr(8, (_Promise = Promise)),
        _dbux.t(17),
        _dbux.traceExpr(
          19,
          new _Promise(
            _dbux.traceArg(18, (r) => {
              var _contextId3 = _dbux.pushImmediate(4, 9, false);
              _dbux.traceExpr(11, r);
              try {
                var _setTimeout;
                return (
                  _dbux.traceExpr(12, (_setTimeout = setTimeout)),
                  _dbux.t(13),
                  _dbux.traceExpr(
                    16,
                    _setTimeout(_dbux.traceArg(14, r), _dbux.traceArg(15, ms))
                  )
                );
              } finally {
                _dbux.popFunction(_contextId3, 10);
              }
            })
          )
        )
      );
      _dbux.t(7);
    } finally {
      _dbux.popResume();
      _dbux.popFunction(_contextId2, 5);
    }
  }

  async function main() {
    var _contextId4 = _dbux.pushImmediate(5, 20, true);
    _dbux.pushResume(6, 20);
    try {
      var _o, _func, _contextId5, _sleep, _o2, _func2;
      _dbux.traceExpr(23, (_o = console)),
        _dbux.traceExpr(24, (_func = _o.log)),
        _dbux.t(25),
        _dbux.traceExpr(27, _func.call(_o, _dbux.traceArg(26, 1)));
      _dbux.postAwait(
        await _dbux.wrapAwait(
          (_dbux.traceExpr(30, (_sleep = sleep)),
          _dbux.t(31),
          _dbux.traceExpr(33, _sleep(_dbux.traceArg(32, 800)))),
          (_contextId5 = _dbux.preAwait(8, 28))
        ),
        _contextId5,
        29
      );
      _dbux.traceExpr(34, (_o2 = console)),
        _dbux.traceExpr(35, (_func2 = _o2.log)),
        _dbux.t(36),
        _dbux.traceExpr(38, _func2.call(_o2, _dbux.traceArg(37, 2)));
      // await sleep(800);
      // console.log(3);
      // await sleep(800);
      // console.log(4);
      // await sleep(800);
      // console.log(5);
      _dbux.t(22);
    } finally {
      _dbux.popResume();
      _dbux.popFunction(_contextId4, 21);
    }
  }

  _dbux.traceExpr(39, (_main = main)),
    _dbux.t(40),
    _dbux.traceExpr(41, _main());

  // setTimeout(main, 100);
  // setTimeout(main, 200);
  // setTimeout(main, 300);
  _dbux.t(3);
} finally {
  _dbux.popProgram();
}