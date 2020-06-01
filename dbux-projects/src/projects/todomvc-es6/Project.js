import sh from 'shelljs';
import Project from 'dbux-projects/src/projectLib/Project';


export default class TodomvcEs6Project extends Project {
  gitUrl = 'https://github.com/kentcdodds/es6-todomvc.git';

  rmFiles = [
    'webpack.config.js',
    'package.json',
    '.babelrc'
  ];

  async installDependencies() {
    // get rid of outdated dependencies; replace with webpack 4 (5?) toolchain
    //  then install updated webpack + babel dependencies
    /*
    await this.exec(`\
        yarn remove webpack webpack-dev-server babel-loader babel-core babel babel-plugin-__coverage__ \
          babel-preset-es2015 babel-preset-es2016 babel-preset-react babel-preset-stage-2 html-webpack-plugin && \
        \
        yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env \
          webpack webpack-cli webpack-dev-server nodemon html-webpack-plugin && \
        \
        yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime`
    );
    */
  }

  async installProject() {
    // get rid of outdated .babelrc
    sh.rm('-f', './.babelrc');

    // git clone etc...
    await super.installProject();
  }

  async loadBugs() {
    return [
      {
        id: 1,
        name: 'test',
        description: 'just run it',
        runArgs: []
      }
    ];
  }

  async runWebpack() {
    return this.execBackground('node node_modules/webpack-dev-server/bin/webpack-dev-server.js --config ./webpack.config.dbux.js');
  }

  async selectBug(bug) {
    // start webpack and webpack-dev-server
    this.runWebpack();
  }

  async testBugCommand(bug, debugPort) {
    // TODO: no bugs yet
  }
}