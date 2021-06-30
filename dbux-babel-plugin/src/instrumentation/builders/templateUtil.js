import template from '@babel/template';
import { addMoreTraceCallArgs } from './buildUtil';
// import * as t from '@babel/types';


export function buildTraceCall(templateString, varFn) {
  const templ = template(templateString);
  return (...args) => {
    const vars = varFn(...args);
    let newNode = templ(vars);
    const cfg = args[args.length - 1];
    if (!cfg?.meta?.keepStatement && newNode.type === 'ExpressionStatement') {
      // we wanted an expression, not a statement
      newNode = newNode.expression;
    }
    addMoreTraceCallArgs(newNode.arguments, cfg);
    return newNode;
  };
}

export function bindExpressionTemplate(templateString, varFn) {
  const templ = template(templateString);
  return (...args) => {
    const vars = varFn(...args);
    let newNode = templ(vars);
    if (newNode.type === 'ExpressionStatement') {
      // we wanted an expression, not a statement
      newNode = newNode.expression;
    }
    return newNode;
  };
}

export function bindTemplate(templateString, fn) {
  const templ = template(templateString);
  return (...args) => {
    const vars = fn(...args);
    let newNode = templ(vars);
    return newNode;
  };
}
