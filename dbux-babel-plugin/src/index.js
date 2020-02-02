import programVisitor from './visitors/programVisitor';
import 'dbux-common/src/util/prettyLogs';
import errorWrapVisitor from './helpers/errorWrapVisitor';
// import { logInternalError } from './log/logger';

export default function dbuxBabelPlugin() {
  return {
    visitor: ({
      Program: programVisitor()
    })
  };
}