// const fsPath = path;
import { initDbux } from './runtime';
import { instrumentFunction } from './instrumentation';


export default function ({ types: t }) {
  return {
    visitor: {
      Program(path, state) {
        // console.log('[FILE]', fsPath.relative(state.cwd, state.filename));
        initDbux(path);
      },
      Function(path, state) {
        // console.log('FUNCTION @', state.filename);

        const { node } = path;
        const line = node.loc?.start?.line;

        if (!line) {
          // this node has been dynamically emitted; not part of the original source code
          return;
        }

        if (path.node.generator) {
          // TOOD: handle generator function
        }

        instrumentFunction(path);
      },

      AwaitExpression(path) {
        // TODO: instrumentAwait
      },

      /**
       * explanation: "`for await (const x of y) { x }` is like a sugar of: `for (const x of y) { await x }` (but call y[Symbol.asyncIterator]() instead of y[Symbol.iterator]())"
       * @see https://github.com/babel/babel/issues/4969)
       */
      ForOfStatement(path) {
        // TODO: instrumentAwait
      },


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
  };
}