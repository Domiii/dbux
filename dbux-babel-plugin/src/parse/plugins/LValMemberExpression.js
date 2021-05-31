import ParsePlugin from '../../parseLib/ParsePlugin';

/**
 * TODO: order of execution!
function f(msg, value) { console.log(msg, value); return value; }
var o = null;
f(1, o).x = (f(2), f(3, o = {}), f(4, o))
 */

/**
 * @example
 * 
 * Two situations: "complex" (c) and "simple" (s)
 * 
 * Case c-1:
 * `a.b.c.prop = f(x)` ->
 * `rhs = te(f(x)), o = tME(tME(a.b).c), o.prop = twME(rhs)`
 *
 * Case c-2:
 * `a.b.c[prop()] = f(x)` ->
 * `rhs = te(f(x)), o = tME(tME(a.b).c), o[te(prop())] = twME(rhs)`
 *
 * Case c-3: nested CallExpression
 * `g(a).h(b).y = f(x)` ->
 * `rhs = te(f(x)), o = tcr(tcME(tcr(tc(g)(ta(a))).h)(ta(b))), o.y = twME(rhs)`
 *
 * Case s-1: simplify if possible
 * `o.prop = f(x)` ->
 * `o.prop = twME(te(f(x)))`
 *
 * Case s-2 (same as previous): due to simplification, `super` syntax is respected.
 * `super.prop = f(x)` ->
 * `super.prop = twME(te(f(x)))`
 * 
 * Case s-3: a little extra when o is CallExpression
 * `f().y = f(x)` ->
 * ``
 * ```
 */
export default class LValMemberExpression extends ParsePlugin {
  get meNode() {
    const [meNode] = this.node.getChildNodes();
    return meNode;
  }

  exit1() {
    const { meNode } = this;

    meNode.handler = this;
  }

  wrapLVal() {
    // TODO
  }

  exit() {
    
  }
}