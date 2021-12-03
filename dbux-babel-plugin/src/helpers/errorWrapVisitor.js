import { codeFrameColumns } from '@babel/code-frame';
import NestedError from '@dbux/common/src/NestedError';
import isFunction from 'lodash/isFunction';
import { pathToString, pathToStringAnnotated } from './pathHelpers';

const Verbose = 0;

let erroredAlready = false;

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
      if (erroredAlready) {
        return undefined;
      }
      erroredAlready = true;
      const [path/* , state */] = args;
      // const { filePath } = state;
      // const { node: { loc } } = path;
      // // const sourceWhere = `${fileName}${loc && `:${loc.start.line}` || ''}`;
      // const info = loc && codeFrameColumns(code, loc) || path.toString();
      // let errorWhere = err.stack.split('\n').splice(1);
      // // errorWhere = errorWhere.filter(line => !line.match('/node_modules/'));
      // let newMessage = `${err.message} \n${info}`;
      // Verbose && (newMessage += `\n---------\n${errorWhere.join('\n')}\n---------\n`);
      // err.message = newMessage;
      // throw err;
      // // throw new Error(newMessage);
      // ${Object.keys(state)}
      throw new NestedError(`@dbux/babel-plugin visitor failed in path "${pathToStringAnnotated(path)}"`, err);
    }
  };
}

export default function errorWrapVisitor(visitor) {
  for (const [typeName, actions] of Object.entries(visitor || {})) {
    if (isFunction(actions)) {
      // simple function
      visitor[typeName] = _errorWrap(actions);
    }
    else {
      // enter/exit actions
      for (const [actionName, f] of Object.entries(actions || {})) {
        actions[actionName] = _errorWrap(f);
      }
    }
  }

  return visitor;
}
