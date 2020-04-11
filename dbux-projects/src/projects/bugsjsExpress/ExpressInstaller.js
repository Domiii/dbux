import ProjectInstaller from '@/projectLib/ProjectInstaller';
import shell from 'shelljs';

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
  async install() {
    // thisDir = "$(getScriptDir "${ BASH_SOURCE[0] } ")"
    // projectPath = "express"
    // githubUrl = "https://github.com/BugsJS/express.git"
    // bugId = "27"
    // tagCategory = "test" # "test", "fix" or "full"

    // if [[ ! -e $projectRoot ]]; then
    //   git clone $githubUrl
    // fi

    // cd $projectRoot

    // # remove git folder
    // # if [[ -e "./.git" ]]; then
    // #   rm -rf "./.git"
    // # fi

    // # checkout right branch
    // git checkout "tags/Bug-$bugId-$tagCategory"

    // code -n .
  }

  async loadBugs() {
    // TODO
  }

  async selectBug(bug) {
    // TODO
  }
}