import { transform } from '@babel/core';
import { mergeConcatArray } from 'dbux-common/src/util/arrayUtil';

export default function justRunMyPlugin(code, plugin, babelOptions) {
  const wrappedPlugin = () => {
    const pluginObj = plugin();
    
    // TODO: ignore instrumented nodes
    return pluginObj;
  };
  babelOptions = mergeConcatArray({
    plugins: [wrappedPlugin]
  }, babelOptions);
  return transform(code, babelOptions).code;
}