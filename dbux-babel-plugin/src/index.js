import './hackfixes';
import '@dbux/common/src/util/prettyLogs';
import { enableLogRecording } from '@dbux/common/src/log/logger';
import programVisitor from './visitors/programVisitor';
// import _slicingTestVisitor from './_slicingTestVisitor';

enableLogRecording();

/**
 * The Dbux Babel plugin.
 * 
 * NOTE: The config is also available via state.opts (see `dbuxState.js`).
 */
export default function dbuxBabelPlugin(/* _, cfg */) {
  const visitor = { Program: programVisitor() };
  // const visitor = _slicingTestVisitor;
  return {
    visitor,

    // see: https://github.com/babel/babel/blob/9808d2566e6a2b2d9e4c7890d8efbc9af180c683/packages/babel-core/src/transformation/index.js#L115
    // post(file) {
    //   console.log('post');
    //   // setTimeout(() => {
    //   //   delete file.ast;
    //   // }, 100);
    // }
  };
}