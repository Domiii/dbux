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
    await this.gitClone();

    // install dbux dependencies
    // await this.installDbuxCli();

    // install
    await this.npmInstall();

    // TODO: copy assets
    // sh.cp('-u', src, dst);


    // TODO: start webpack
    // TODO: manage/expose (webpack) bug background process
  }

  async loadBugs() {
    // TODO!
    return [];
  }

  async selectBug(bug) {
    // TODO!
  }

  async testBugCommand(bug, debugPort) {
    // TODO!
  }
}