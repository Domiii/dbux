import Express from './projects/express/Project';
import Hexo from './projects/hexo/Project';
import Eslint from './projects/eslint/Project';
import TodomvcEs6 from './projects/todomvc-es6/Project';
import ChartJs from './projects/Chart.js/Project';
import RealworldWebComponentsProject from './projects/realworld-web-components/Project';
import JavascriptAlgorithmProject from './projects/javascript-algorithms/Project';
import SequelizeProject from './projects/sequelize/Project';
import Project2048 from './projects/2048/Project';
import EditorMdProject from './projects/Editor.md/Project';
import WebpackProject from './projects/webpack/Project';
import NodeFetchProject from './projects/node-fetch/Project';
import BluebirdProject from './projects/bluebird/Project';
import AsyncJsProject from './projects/async-js/Project';

// eslint-disable-next-line import/no-mutable-exports
let registry = {
  'todomvc-es6': TodomvcEs6,
  2048: Project2048,
  express: Express,
  'node-fetch': NodeFetchProject,
};

if (process.env.NODE_ENV === 'development') {
  // for now, only expose our well tested Express project

  registry = {
    ...registry,

    'async-js': AsyncJsProject,
    
    eslint: Eslint,

    // NOTE: sequelize not a good public candidate due to the sqlite dependency losing binaries over time
    sequelize: SequelizeProject,

    zzBluebird: BluebirdProject,

    'Editor.md': EditorMdProject,
    webpack: WebpackProject,
    'javascript-algorithms': JavascriptAlgorithmProject,
    'Chart.Js': ChartJs,
    hexo: Hexo,
    'realworld-web-components': RealworldWebComponentsProject
  };
}

export default registry;