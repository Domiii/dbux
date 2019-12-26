import { wrapFunctionBody } from './instrumentation/trace';
import * as t from '@babel/types';
import { getAllClassParents } from './helpers/astGetters';
import { guessFunctionName } from './helpers/functionHelpers';


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

      // TODO: parent.key, parent.id
      const classParents = getAllClassParents(path);

      let displayName = name && name || '(anonymous)';
      if (classParents.length) {
        displayName = classParents.map(p => p.node.id.name).join('.') + '.' + displayName;
      }

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
        // TOOD: some special treatment for generator functions?
      }
    }
  }
}