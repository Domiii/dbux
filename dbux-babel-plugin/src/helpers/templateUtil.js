import template from '@babel/template';
// import * as t from '@babel/types';


export function bindTemplate(templateString, fn) {
  return fn.bind(null, template(templateString));
}