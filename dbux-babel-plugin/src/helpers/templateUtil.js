import template from '@babel/template';
// import * as t from '@babel/types';


export function bindTemplate(templateString, fn) {
  const templ = template(templateString);
  return (...args) => {
    const options = fn(...args);
    return templ(options);
  };
}