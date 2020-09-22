import programVisitor from './visitors/programVisitor';
import '@dbux/common/src/util/prettyLogs';
// import { logInternalError } from './log/logger';

/**
 * The Dbux Babel plugin.
 * 
 * NOTE: The config is also available via state.opts,
 * which we use in several places, e.g. `dbuxState.js`.
 */
export default function dbuxBabelPlugin(_, cfg) {
  return {
    visitor: ({
      Program: programVisitor()
    })
  };
}