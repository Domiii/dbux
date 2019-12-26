import { wrapFunctionBody } from './instrumentation/trace';
import { guessFunctionName, getFunctionDisplayName } from './helpers/functionHelpers';

export default function functionVisitor() {
  return {
    enter(path, state) {
      if (!state.onEnter(path)) return;
      // console.warn('F', path.toString());

      const { loc } = path.node;
      if (!loc) {
        // this node has been dynamically emitted; not part of the original source code
        return;
      }
      const { start, end } = loc;
      const staticId = state.staticSites.length;
      path.setData('staticId', staticId);

      // console.log('FUNCTION', path.get('id')?.name, '@', `${state.filename}:${line}`);

      const staticContextParent = path.findParent(p => !!p.getData('staticId'));
      const parentStaticId = staticContextParent.getData('staticId');

      // console.log('actualParent',  toSourceString(actualParent.node));

      const name = guessFunctionName(path);
      const displayName = getFunctionDisplayName(path);

      const staticContextData = {
        staticId,
        type: 2,
        name,
        displayName,
        start,
        end,
        parent: parentStaticId,
      };
      state.staticSites.push(staticContextData);

      const bodyPath = path.get('body');

      wrapFunctionBody(bodyPath, staticId, state);

      if (path.node.generator) {
        // TOOD: special treatment for generator functions
      }
    }
  }
}