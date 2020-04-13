import sh from 'shelljs';
import { newLogger } from 'dbux-common/src/log/logger';
import ProjectInstaller from '../../projectLib/ProjectInstaller';


const { log, debug, warn, error: logError } = newLogger('dbux-code');

/*
#!/usr/bin/env bash

set -x    # trace mode

source "../../_install.common.sh"

# config
thisDir="$(getScriptDir "${BASH_SOURCE[0]}")"
projectPath="express"
githubUrl="https://github.com/BugsJS/express.git"
bugId="27"
tagCategory="test" # "test", "fix" or "full"


# let's go!

projectPathAbsolute="$ProjectsRoot/$projectPath)"
projectRoot="$ProjectsRoot/$(getFirstInPath "$projectPath")"


# clone
cd $ProjectsRoot
if [[ ! -e $projectRoot ]]; then
  git clone $githubUrl
fi

cd $projectRoot

# remove git folder
# if [[ -e "./.git" ]]; then
#   rm -rf "./.git"
# fi

# checkout right branch
git checkout "tags/Bug-$bugId-$tagCategory"

code -n .


# `# copy files (NOTE: Cygwin does not support glob-style copy)`
# cp "$thisDir/files/package.json" .
# cp "$thisDir/files/webpack.config.js" .
# cp "$thisDir/files/nodemon.json" .

# `# install default dependencies`
# yarn install

# `# install the good stuff`
# yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
# yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
# yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime

# `# run it!`
# npm start

*/

export default class ExpressInstaller extends ProjectInstaller {
  githubUrl = 'https://github.com/BugsJS/express.git';

  async installProject() {
    const {
      project: {
        projectPath
      },
      githubUrl
    } = this;

    // cd into it
    sh.cd(projectPath);

    // TODO: read git + editor commands from config

    // clone (will do nothing if already cloned)
    debug(`Cloning from ${githubUrl}...`);
    await this.exec(`git clone ${githubUrl}`);

    // open editor
    await this.exec(`code -n .`, { silent: false }, true);
  }

  async loadBugs() {
    // TODO!
    return [
      {
        id: 27,
        name: 'express bug 27'
      }
    ];
  }

  async selectBug(bug) {
    const bugId = bug.id;
    const tagCategory = "test"; // "test", "fix" or "full"

    // checkout the bug branch
    sh.exec(`git checkout "tags/Bug-${bugId}-${tagCategory}"`);
  }
}