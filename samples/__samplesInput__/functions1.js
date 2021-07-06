
// FunctionDeclaration
function f() { return 2; }

// FunctionExpression
const g = function g() { return 3; };
const g2 = function g2() { return g; };

// ArrowFunctionExpression
const h = () => { return 4; };
const h2 = () => 5;

[
  f,
  g,
  g2(),
  h,
  h2
].forEach((res, i) => {
  console.log(i, res.name);
});
