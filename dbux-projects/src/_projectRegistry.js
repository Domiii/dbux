import Express from './projects/express/Project';
import Hexo from './projects/hexo/Project';
import Eslint from './projects/eslint/Project';
import TodomvcEs6 from './projects/todomvc-es6/Project';
import ChartJs from './projects/Chart.js/Project';
import RealworldWebComponentsProject from './projects/realworld-web-components/Project';
import JavascriptAlgorithmProject from './projects/javascript-algorithms/Project';

// eslint-disable-next-line import/no-mutable-exports
let registry = {
  express: Express,
  'todomvc-es6': TodomvcEs6,
  eslint: Eslint,
};

if (process.env.NODE_ENV === 'development') {
  // for now, only expose our well tested Express project
  
  registry = {
    ...registry,

    'Chart.Js': ChartJs,
    hexo: Hexo,
    'realworld-web-components': RealworldWebComponentsProject,
    'javascript-algorithms': JavascriptAlgorithmProject
  };
}

export default registry;