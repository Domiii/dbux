const g = require('graph-filter-test/g');

function f(indent, x, children) {
  console.log(indent, 'f', x);
  if (children) {
    for (const c of children) {
      c();
    }
  }
}


function treeAsync(args, indent = '', x = 'ROOT') {
  let f, children;
  if (Array.isArray(args)) {
    [f, children] = args;
  }
  else {
    f = args;
  }

  const subTree = children?.map((child, i) => treeAsync(child, indent + ' ', i)) || [];

  return function _asyncTreeNode() {
    setTimeout(f.bind(null, indent, x, subTree));
  };
}

(function main() {
  return treeAsync([
    f,
    [
      g,
      g,
      [f, [
        f,
        [g, [
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
          ]]
        ]],
        f
      ]],
      f
    ]
  ])();
})();