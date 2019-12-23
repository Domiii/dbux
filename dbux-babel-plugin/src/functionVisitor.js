import { getLine, toSourceString } from './helpers/misc';
import { wrapFunctionBody } from './instrumentation/trace';


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

      const actualParent = path.findParent(p => !!p.getData('staticId'));
      const parentStaticId = actualParent.getData('staticId');

      // console.log('actualParent',  toSourceString(actualParent.node));

      const { node } = path;
      const name = node.key ? node.key.name : node.id?.name;

      // TODO: parent.key, parent.id

      state.staticSites.push({
        staticId,
        type: 2,
        name,
        start,
        end,
        parent: parentStaticId
      });

      const bodyPath = path.get('body');

      wrapFunctionBody(bodyPath, staticId, state);

      if (path.node.generator) {
        // TOOD: some special treatment for generator functions?
      }
    }
  }
}