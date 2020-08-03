import babelRegister from '@babel/register';

import buildBabelOptions from './buildBabelOptions';

export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);
  babelRegister(babelOptions);
}