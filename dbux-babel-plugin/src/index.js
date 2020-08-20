import programVisitor from './visitors/programVisitor';
import '@dbux/common/src/util/prettyLogs';
// import { logInternalError } from './log/logger';

export default function dbuxBabelPlugin(_, cfg) {
  return {
    visitor: ({
      Program: programVisitor()
    })
  };
}