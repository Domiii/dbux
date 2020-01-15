import { codeFrameColumns } from '@babel/code-frame';

/**
 * Proper error extraction:
 * 1. show the source code that we failed to instrument
 * 2. show the relevant lines of code (exclude calls from within node_modules)
 */
function _errorWrap(visitor) {
  // console.warn('errorWrap', visitor.toString());
  return (...args) => {
    try {
      return visitor.apply(this, args);
    }
    // finally {
      
    // }
    catch (err) {
      const [path, { file: { code } }] = args;
      const { node: { loc } } = path
      // const sourceWhere = `${fileName}${loc && `:${loc.start.line}` || ''}`;
      const info = loc && codeFrameColumns(code, loc) || path.toString();
      let errorWhere = err.stack.split('\n').splice(1);
      // errorWhere = errorWhere.filter(line => !line.match('/node_modules/'));
      const newMessage = `${err.message} \n${info}\n---------\n${errorWhere.join('\n')}\n---------\n`;
      throw new Error(newMessage);
    }
  }
}

export default function errorWrapVisitor(visitor) {
  for (const [visitorName, actions] of Object.entries(visitor || {})) {
    for (const [actionName, f] of Object.entries(actions || {})) {
      actions[actionName] = _errorWrap(f);
    }
  }

  return visitor;
}
