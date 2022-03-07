const g = require('graph-filter-test/g');

function f(indent, x, children) {
  console.log(indent, 'f', x);
  if (children) {
    for (const c of children) {
      c();
    }
  }
}


function tree(args, indent = '', x = 'ROOT') {
  let f, children;
  if (Array.isArray(args)) {
    [f, children] = args;
  }
  else {
    f = args;
  }

  const subTree = children?.map((child, i) => tree(child, indent + ' ', i)) || [];

  return f.bind(null, indent, x, subTree);
}

(function main() {
  const t = tree(
    [f, [
      [g, [
        g,
        g,
        g
      ]],
      g,
      [f, [
        f,
        g,
        g,
        [g, [
          g,
          f,
          g,
          [f, [
            f,
            f
          ]]
        ]],
        f
      ]],
      f
    ]]
  );
  t();
})();