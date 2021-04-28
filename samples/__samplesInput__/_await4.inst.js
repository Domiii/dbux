[90m[Dbux] linkOwnDependencies {"targetFolder":"c:\\Users\\domin\\code\\dbux\\dbux-cli","dependencyRoot":"C:\\Users\\domin\\code\\dbux"}[39m
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
// Instrumenting file c:\Users\domin\code\dbux\samples\__samplesInput__\await4.js...
[Dbux traceVisitors] [v] -> Function.body: {   const a = await f();   const b = await f(1); }
[Dbux traceVisitors] [II] -> Function.body: {   const a = await f();   const b = await f(1); }
[Dbux traceVisitors] [v] -> VariableDeclarator.init: await f()
[Dbux traceVisitors] [II] -> VariableDeclarator.init: await f()
[Dbux traceVisitors] [v] -> AwaitExpression: await f()
[Dbux traceVisitors] [v] -> CallExpression: f()
[Dbux traceVisitors] [II] -> CallExpression: f()
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _f = f
[Dbux traceVisitors] [v] -> SequenceExpression.expressions: _f()
[Dbux traceVisitors] [v] -> AssignmentExpression: _f = f
[Dbux traceVisitors] [II] -> AssignmentExpression: _f = f
[Dbux traceVisitors] [v] <- AssignmentExpression: _f = f
[Dbux traceVisitors] [II] <- AssignmentExpression: _f = f
[Dbux traceVisitors] [v] -> AssignmentExpression: _f = f
[Dbux traceVisitors] [v] <- AssignmentExpression: _f = f
[Dbux traceVisitors] [v] -> CallExpression: _f()
[Dbux traceVisitors] [v] <- CallExpression: _f()
[Dbux traceVisitors] [II] <- CallExpression: _f()
[Dbux traceVisitors] [v] -> CallExpression: _f()
[Dbux traceVisitors] [v] <- CallExpression: _f()
[Dbux traceVisitors] [v] <- AwaitExpression: await (_dbux.traceExpr(7, _f = f), _dbux.t(8), _dbux.traceExpr(9, _f()))
[Dbux traceVisitors] [II] <- AwaitExpression: await (_dbux.traceExpr(7, _f = f), _dbux.t(8), _dbux.traceExpr(9, _f()))
exiting...
