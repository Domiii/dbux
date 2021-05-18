import template from '@babel/template';
// import * as t from '@babel/types';


export function bindExpressionTemplate(templateString, fn) {
  const templ = template(templateString);
  return (...args) => {
    const options = fn(...args);
    let newNode = templ(options);
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
    const options = fn(...args);
    let newNode = templ(options);
    return newNode;
  };
}