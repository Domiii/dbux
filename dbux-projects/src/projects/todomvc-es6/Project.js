import path from 'path';
import sh from 'shelljs';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import Project from 'dbux-projects/src/projectLib/Project';


export default class TodomvcEs6Project extends Project {
  githubUrl = 'https://github.com/kentcdodds/es6-todomvc.git';

  async installDependencies() {
    // # yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
    // # yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
    // # yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime
  }

  async installProject() {
    // git clone
    await this.gitClone();

    // install dbux dependencies
    // await this.installDbuxCli();
    await this.copyAssets();

    // get rid of outdated dependencies; replace with webpack 4 (5?) toolchain
    // await this.exec('yarn remove webpack webpack-dev-server babel-loader babel-core babel babel-plugin-__coverage__ babel-preset-es2015 babel-preset-es2016 babel-preset-react babel-preset-stage-2 html-webpack-plugin');

    // get rid of outdated .babelrc
    sh.rm('-f', './.babelrc');

    // yarn install
    await this.yarnInstall();

    // install updated webpack + babel dependencies
    // await this.exec(`yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env \
    //     webpack webpack-cli webpack-dev-server nodemon html-webpack-plugin && \
    // yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime`);
  }

  async run() {
    return this.execBackground('node node_modules/webpack-dev-server/bin/webpack-dev-server.js --config ./webpack.config.js --env.dev');
  }

  async loadBugs() {
    // TODO: local patch files (in assets/)?
    return [
      {
        id: 1,
        name: 'test',
        description: 'just run it',
        runArgs: []
      }
    ];
  }

  async selectBug(bug) {
    // TODO!

  }

  async testBugCommand(bug, debugPort) {
    // TODO!
    // TODO: start webpack if not yet running
    // TODO: manage/expose (webpack) bug background process
    // return '';
  }
}