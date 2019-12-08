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

        instrumentFunction(path);
      }
    }
  };
}