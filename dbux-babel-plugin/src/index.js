import programVisitor from './programVisitor';
import functionVisitor from './functionVisitor';
import { codeFrameColumns } from '@babel/code-frame';
import 'dbux-common/src/util/betterLogs';
// import { logInternalError } from './log/logger';

/**
 * Proper error extraction from:
 * 1. show the source code that we failed to instrument
 * 2. show the relevant lines of code (exclude calls from within node_modules)
 */
function errorWrapVisitor(visitor) {
  return (...args) => {
    try {
      return visitor(...args);
    }
    catch (err) {
      const [path, { file: { code }, fileName }] = args;
      const { node: { loc } } = path
      // const sourceWhere = `${fileName}${loc && `:${loc.start.line}` || ''}`;
      const info = loc && codeFrameColumns(code, loc) || path.toString();
      const errorStack = err.stack.split('\n').splice(1);
      const errorWhere = errorStack.filter(line => !line.match('/node_modules/'));
      const newMessage = `${err.message} \n${info}\n---------\n${errorWhere.join('\n')}\n---------\n`;
      throw new Error(newMessage);
    }
  }
}

function errorWrapPlugin(pluginCfg) {
  for (const [_, actions] of Object.entries(pluginCfg.visitor || {})) {
    for (const [actionName, f] of Object.entries(actions || {})) {
      actions[actionName] = errorWrapVisitor(f);
    }
  }
  return pluginCfg;
}

export default function dbuxBabelPlugin() {
  return errorWrapPlugin({
    visitor: {
      Program: programVisitor(),
      Function: functionVisitor(),

      // AwaitExpression(path) {
      //   // TODO: instrumentAwait
      // },

      // /**
      //  * TODO: Handle `for await of`
      //  * explanation: "`for await (const x of y) { x }` is like a sugar of: `for (const x of y) { await x }` (but call y[Symbol.asyncIterator]() instead of y[Symbol.iterator]())"
      //  * @see https://github.com/babel/babel/issues/4969)
      //  */
      // ForOfStatement(path) {
      //   // TODO: instrumentAwait
      // },


      /*
      more TODO:
      see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
      see: https://stackoverflow.com/questions/2734025/is-javascript-guaranteed-to-be-single-threaded/2734311#2734311
 
      instrumentTimingEvents(); // setTimeout + setInterval + process.nextTick
      instrumentInterruptEvents(); // alert, confirm, prompt etc
      instrumentThenables(); // TODO: then, catch, finally, etc.. // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
      generator functions
 
 
      //instrumentOtherCallbacks(); // e.g.: event handlers, non-promisified libraries
      // big problem => sending objects into blackboxed modules that will call methods on them
      */
    }
  });
}