import BaseNode from './BaseNode';

/**
 * 
 */
export default class ObjectMethod extends BaseNode {
  static children = [
    'key',
    'params',
    'body'
  ];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  // TODO: `ObjectMethod` -> `kind !== method`

  // get traceCfg() {
  //   const [TODO] = this.getChildNodes();
  //   return argNode?.traceCfg;
  // }

  // createDefaultTrace() {
  //   const [TODO] = this.getChildNodes();
  //   const traceData = argNode?.createDefaultTrace(); // || this.createOwnDefaultTrace();

  //   // TODO: need to instrument in order to trace this

  //   if (traceData.path === argNode.path) {  // small sanity check
  //     // // NOTE: we actually tace `argument`, but we want the "selectable trace" to be the entire `SpreadElement`
  //     // traceData.path = this.path;
  //     // traceData.meta = traceData.meta || {};
  //     // traceData.meta.replacePath = argNode.path;
  //   }

  //   return traceData;
  // }
}