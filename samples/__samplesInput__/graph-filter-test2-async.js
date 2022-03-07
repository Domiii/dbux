const g = require('graph-filter-test/gAsync');

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function f(indent, x, children) {
  console.log(indent, 'f', x);
  await sleep(200);
  if (children) {
    for (const c of children) {
      await c();
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
      [g, [
        g,
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
        // f
      ]],
      // f
    ]
  ])();
})();