/**
 * @file `await` instrumentation analysis
 */

var p = (_dbux.traceExpr(30, (_sleep = sleep)),
  _dbux.t(31),
  _dbux.traceExpr(33, _sleep(_dbux.traceArg(32, 800)))); // var p = f();

/**
 * Order:
 * f() > preAwait > wrapAwait ---> postAwait
 */


var arg;
var awaitContextId;
_dbux.postAwait(
  arg = f(),
  await _dbux.wrapAwait(
    arg, // argument
    (awaitContextId = _dbux.preAwait(staticId, preTraceId))
  ),
  _contextId5,
  29
);


/**
 * low priority TODOs:
 * 
 * * fix postAwait's `resumeInProgramStaticTraceId` to be higher than all previous (especially `CallResult`) trace ids
 */


// ###########################################################################
// raw
// ###########################################################################

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