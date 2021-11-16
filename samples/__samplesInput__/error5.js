var obj = {}
var prep = Error.prepareStackTrace

function getStack() {
  Error.prepareStackTrace = prepareObjectStackTrace;
  Error.captureStackTrace(obj, getStack);

  var stack = obj.stack

  console.log('stack:', stack);
}

try {
  getStack();
}
catch (err) {
  console.error('err', err);
}

/* dbux disable */
function prepareObjectStackTrace(obj, stack) {
  return stack
}
