/**
 */

function f({ before, after } = { before: 1, after: 2 }) {
  let allArgs = [];
  if (before) allArgs = [before].concat(allArgs);
  if (after) allArgs = allArgs.concat(after);
  console.log(allArgs);
}

f();
