TODOs moved to: https://github.com/Domiii/dbux/issues/521


# Relevant types

* Potential lvals
  * `MemberExpression`
    * `OptionalMemberExpression` [es6]
  * `Identifier`

  * patterns [es6]
     * `AssignmentPattern`
     * `RestElement`
     * `ObjectPattern`
     * `ArrayPattern`

* assignments
  * `AssignmentExpression`
  * `VariableDeclaration`

* function + calls
  * `Function`
  * `ReturnStatement`
  * `YieldExpression` [es6]

  * `CallExpression`
    * `OptionalCallExpression` [es6]
  * `NewExpression`
  * `Super` [es6]

* Arithmetic
  * `BinaryExpression`
  * `UnaryExpression`
  * `LogicalExpression`

* Value-creating/-changing
  * `UpdateExpression`
    * add both `read` and `write` nodes, similar to the corresponding `AssignmentExpression` (i++ ~ i = i+1)
  * `{Array,Object}Expression`
    * 1 parent `read` + many `write` children
    * problem: we don't know the path when capturing the children writes
  * `TemplateLiteral` [es6]

* loops (all have reads + writes)
  * `ForStatement`
  * `ForInStatement`
  * `DoWhileLoop`
  * `WhileStatement`
  * `ForOfStatement` [es6]
* Class [es6]
  * `Class{Expression,Statement}`
  * `ClassPrivateProperty`
  * `ClassProperty`

* other
  * `IfStatement`
  * `SwitchStatement`
  * `SwitchCase`
  * `ConditionalExpression`
  * `SequenceExpression`
  * `Decorator` [es6]

* error propagation
  * `ThrowStatement`
  * `CatchClause`

* `AwaitExpression`


* Other Statements (currently not of great concern to data dependency tracking)
  * `BreakStatement`
  * `ContinueStatement`
  * `TryStatement`
  * `ExpressionStatement`
  * `VariableDeclaration`



# Edges

## !Jump

### Write && !Jump
* `AssignmentExpression`
  * e.g.
    * `l = r` -> `l = tw(r, %tid2%)`
    * `l = a + b` -> `l = tw(te(a + b, %tid1%), %tid2%, [tid1])`
    * `l[x] = y` -> `l[te(x, %tid1%)] = twME()`
* `VariableDeclarator`
  * e.g. 
    * `var x = r;` -> `var x = tw(r, %tid0%);`
  * (used by `ForXStatement.left`)
    * (implies `ForInStatement`, `ForOfStatement`)
* `FunctionDeclaration`
* `ClassDeclaration`, e.g. `class A {}` -> `class A {}; tw(A, %tid0%);`

### Write && !Jump && Nested
* `Method`: `ClassMethod`, `ClassPrivateMethod`, `ObjectMethod`
  * sub-category getters + setters
    * Getters: `kind` === 'get'
      * e.g. `get f()`
    * Setters: `kind` === 'set'
      * e.g. `set f(val)`
* `ClassPrivateProperty`, `ClassProperty`
  * Variables: `static`
* `{Array,Object}Expression.properties`
  * NOTE: recursive
  * NOTE: need to get `refId` from parent, before being able to store the writes
  * `{ a: 1 }` -> `tOe({ a: tw(1, %tid1%) }, %tid0%, [tid1])`


### Read && !Jump
* Arithmetic expression
* `{Array,Object}Expression`
* `TemplateLiteral`
  * `expressions`, (`quasis`)
* `SequenceExpression`
  * NOTE: right-most expression is returned
* `AwaitExpression`
* `ClassExpression`, e.g. `f(class A {})` -> `te(class A {}, %tid0%);`
* `Function`
  * `ArrowFunctionExpression`
  * `FunctionExpression`


## Jump

### Write && Jump
* `CallExpression.arguments` -> `Function.params`
  * more input types:
    * `RestElement`
      * `function f(...x) { ... }` (`last(Function.params)`)
    * `RestElement.argument`
      * `f(...x);`
  * more inputs: `callee`
    * can be `Super`
  * also: `OptionalCallExpression`, `NewExpression`
* `ThrowStatement` -> `CatchClause`
  * NOTE: similar to return from callee to caller

### Read && Jump
* {`ReturnExpression`,`YieldExpression`}.`argument` -> `CallExpression`
  * also: `OptionalCallExpression`, `NewExpression`
  * if is constructor, returns `this`


## Obscure/advanced (probably Future Work)
* `Object.defineProperty`
  * `get`, `set`, `value`
* `Decorator`
  * NOTE: similar to a `CallExpression` with trailing expression passed in as first argument?
* Proxy interactions
* String reference equality(???)
  * NOTE: In JS, one cannot access string reference (memory location)


# `LVal` types
* `Identifier`
* `ArrayPattern`, `ObjectPattern`
  * e.g. `{ x } = o`, `[ x ] = o` (`AssignmentExpression.left`)
  * NOTE: these are recursive
  * NOTE: can contain `AssignmentPattern`
    * e.g. `{ x = 3 } = o;`
* `MemberExpression`
  * e.g. `x.a`, `x[b]`
  * also `OptionalMemberExpression`


# Values

* `SwitchStatement`
  * `discriminant`
  * `SwitchCase.test`

## "Value-creating" types

Most expressions just pass along memory addresses, without actually generating new data. We want to differentiate between those, and those that create new values. In that case `staticTrace.dataNode.isNew === true`.

The following AST types (mostly expressions) generate new values:

* `NewExpression` (`new A()`)
* `ArithmeticExpression`
* `UpdateExpression`
* `{Array,Object}Expression` (`[1,2]`, `{x : 3}`)
  * (object initializer)
* `Literal`
  * (implies `TemplateLiteral`)
  * Expression, Pureish, Literal, Immutable
    * {BigInt,Boolean,Decimal,Null,Numeric,RegExp,String}Literal
* `ClassDeclaration`
* `Function`
  * NOTE: includes `FunctionDeclaration` and `Method` which are not expressions
* `Decorator`


## read tree propagation

## Complex read types

### MemberExpression
* `object`, `property`
* NOTE: we want to establish full chain, i.e.: `o.a.b.c.d.e`
* also: `OptionalMemberExpression`

```js
function f(x) { console.log('f', x); return x; }
var o = { p: { q: { a: 3 } } };
o[f('p')][f('q')].a
```
> f p
> f q
> 3

`%tid% = '%traceId% = %traceIdFn%(...)'`

* if ME is expression --
  * convert: `o.a[x].b.c[y]`
  * to: `te(o.a[te(x, %tid1%)].b.c[te(y, %tid2%)], %tid3%, %cmd%);`
    * `%cmd% = objectRead(tid3, tid1, tid2)`
  * advanced
    * conditional pathing
      * NOTE: cannot be LVal
      * `o?.a?.[p?.[x].a]`

* if ME is LVal --
  * convert: `o.a[x].b.c[y] = %value%`
  * to: `o.a[te(x, %tid1%, %cmd1%)].b.c[te(y, %tid2%, %cmd2%)] = te(..., %cmd0%)`
    * `%cmd0% = objectWrite(%tid0%, 0)`
    * `%cmd1% = objectWrite(tid0, 0)`
    * `%cmd2% = objectWrite(tid0, 1)`
  * advanced
    * nested MEs
      * NOTE: should work as-is, thanks to `tid0`
      * `o[q[a][b].c][p[x][y[z]].w]`

# Parser

## Concepts

* Reads
  * inputs are:
    * either propagated as-is ("Propagating expression types"; also "value-creating")
    * or mapped to output
* Writes
  * possible "targetPaths":
    * one or more variables
    * zero or more paths in those variables
* `ParseStack`
* generic data (mark `onEnter`):
  * `isLVal`

# Some Complex Parsing Examples

## ClassProperty

NOTE: `ClassProperty` can observe some complex recursive behavior. E.g.:

```js
const p = 'p1', q = 'q1';
class A {
  // NOTE: order is q.RHS -> p.RHS -> p.LHS -> qLHS
  [p] = new class B { [q] = 3; };
}
console.log(new A().p1.q1);
```

```js
function setPKey(that, st key) { ... }
function registerPropKeyValueAccess(that, st, value) {
  const key = getAndDeleteKey(that, st);
  register(st, {
    read: [
      that,
      key,
      value
    ],
    write: [
      that,
      objPath(that, key)
    ]
  });
}
function expr(st, val) { registerRead(st, val); return val; }
function pKey(that, st, parentSt, key) { console.log('pKey', that, key); setPKey(that, st, key); return key; }

var stF = 1
var stFArg1 = 2
var stFResult = 3;
var stProp = 4;
function f(x) { return 'f' + x; };

// let key1Id, val1Id

class A {
  // [f('p1')] = f(3);
  [traceWriteResolve(te(f('p1'), this, key1Id = traceId()), key1Id, val1Id)] = traceWriteDeferred(
    deferredTargetPath(this, deferedVar('key1Id')), 
    [ ... ],
    te(te(f, ...)(te(3, ...), ...),
    val1Id = traceId()
    );
}

var a = new A();
console.log(a.p1);
```
