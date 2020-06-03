import programVisitor from './visitors/programVisitor';
import 'dbux-common/src/util/prettyLogs';
import errorWrapVisitor from './helpers/errorWrapVisitor';
// import { logInternalError } from './log/logger';

debugger;
console.warn('### dbux-babel-plugin', 1)
export default function dbuxBabelPlugin() {
  console.warn('### dbux-babel-plugin', 2)
  return {
    visitor: ({
      Program: programVisitor()
    })
  };
}