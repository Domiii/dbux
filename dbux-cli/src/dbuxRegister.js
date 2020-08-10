import babelRegister from '@babel/register';
import buildBabelOptions from './util/buildBabelOptions';

// link dependencies
import '../lib/link-dependencies';

// babelRegister
export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);
  babelRegister(babelOptions);
}