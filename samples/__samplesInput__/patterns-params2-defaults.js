/**
 */

function f({ before, after } = {}) {
  let allArgs = this._args;
  if (before) allArgs = [before].concat(allArgs);
  if (after) allArgs = allArgs.concat(after);
  if (allArgs.length === 0) {
    return "";
  } else {
    return allArgs.join(", ");
  }
}

f();
