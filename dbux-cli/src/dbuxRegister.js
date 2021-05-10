import babelRegister from '@babel/register';
import buildBabelOptions from './buildBabelOptions';

import './linkOwnDependencies';
import { purgeModuleCache } from './util/moduleCacheUtil';

// babelRegister
export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);
  if (babelOptions) {
    console.error('babelRegister', JSON.stringify(options));
    purgeModuleCache();
    babelRegister(babelOptions);
  }
}