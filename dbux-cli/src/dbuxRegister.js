import babelRegister from '@babel/register';
import buildBabelOptions from './util/buildBabelOptions';

// link dependencies
import './linkOwnDependencies';

// babelRegister
export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);
  babelRegister(babelOptions);
}