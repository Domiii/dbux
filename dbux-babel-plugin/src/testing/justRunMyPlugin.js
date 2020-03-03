import { transform } from '@babel/core';
import { mergeConcatArray } from 'dbux-common/src/util/arrayUtil';

export default function justRunMyPlugin(code, plugin, babelOptions) {
  babelOptions = mergeConcatArray({
    plugins: [ plugin ]
  }, babelOptions);
  return transform(code, babelOptions).code;
}