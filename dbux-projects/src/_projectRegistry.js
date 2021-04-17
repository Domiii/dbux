import Express from './projects/express/Project';
import Hexo from './projects/hexo/Project';
import Eslint from './projects/eslint/Project';
import TodomvcEs6 from './projects/todomvc-es6/Project';
import ChartJs from './projects/Chart.js/Project';
import RealworldWebComponentsProject from './projects/realworld-web-components/Project';
import JavascriptAlgorithmProject from './projects/javascript-algorithms/Project';
import Project2048 from './projects/2048/Project';
import EditorMdProject from './projects/Editor.md/Project';

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

    2048: Project2048,
    'Editor.md': EditorMdProject,
    'javascript-algorithms': JavascriptAlgorithmProject,
    'Chart.Js': ChartJs,
    hexo: Hexo,
    'realworld-web-components': RealworldWebComponentsProject
  };
}

export default registry;