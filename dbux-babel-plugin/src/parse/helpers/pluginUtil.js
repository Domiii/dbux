// import { pathToString } from '../../helpers/pathHelpers';

import isFunction from 'lodash/isFunction';

export function pickPlugin(node, keyOrKeyFun, byKey) {
  let key;
  if (isFunction(keyOrKeyFun)) {
    key = keyOrKeyFun(node);
  }
  else {
    key = keyOrKeyFun;
  }
  const pluginName = byKey[key];
  if (!pluginName) {
    node.logger.error(`unknown plugin key: "${key}" at "${node}" in "${node.getParent()}"`);
  }
  // console.debug(`[LVAL] key = ${key} - ${pathToString(node.path)}`);
  return pluginName;
}