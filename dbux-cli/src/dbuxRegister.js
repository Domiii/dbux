import babelRegister from '@babel/register';
import buildBabelOptions from './buildBabelOptions';

// link dependencies
import './linkOwnDependencies';

// babelRegister
export default function dbuxRegister(options) {
  const babelOptions = buildBabelOptions(options);
  if (babelOptions) {
    console.error('babelRegister', JSON.stringify(options));
    babelRegister(babelOptions);
  }
}