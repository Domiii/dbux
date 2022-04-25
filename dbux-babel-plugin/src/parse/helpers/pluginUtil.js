// import { pathToString } from '../../helpers/pathHelpers';

import isFunction from 'lodash/isFunction';

/**
 * @return {string} Name of plugin entry. Name is used to look up plugin in `ParseNode` via `ParseRegistry`.
 */
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
    if (!(key in byKey)) {
      // key was not registered
      node.logger.error(`unknown plugin key: "${key}" at "${node}" in "${node.getParent()}"`);
    }
  }
  return pluginName;
}