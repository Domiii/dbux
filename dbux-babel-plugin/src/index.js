import programVisitor from './programVisitor';
import functionVisitor from './functionVisitor';


export default function dbuxBabelPlugin() {
  return {
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
  };
}