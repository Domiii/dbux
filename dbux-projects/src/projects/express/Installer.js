import sh from 'shelljs';
import { newLogger } from 'dbux-common/src/log/logger';
import exec from 'dbux-projects/src/util/exec';
import ProjectInstaller from '../../projectLib/ProjectInstaller';


const { log, debug, warn, error: logError } = newLogger('dbux-projects/Installer');

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
        projectsRoot,
        projectPath
      },
      githubUrl
    } = this;

    // cd into project root
    sh.cd(projectsRoot);

    // TODO: read git + editor commands from config

    // clone (will do nothing if already cloned)
    const curDir = sh.pwd();
    debug(`Cloning (if not already cloned) from "${githubUrl}"\n  in "${curDir}"...`);
    const result = await exec(`git clone ${githubUrl}`);
    // log('  ->', result.err || result.out);
    // (result.err && warn || log)('  ->', result.err || result.out);
    debug(`Cloned.`);

    // TODO: copy assets
    // TODO: start webpack if necessary
    // TODO: manage/expose (webpack) bug background process
  }

  async loadBugs() {
    // TODO: load automatically from BugsJs bug database
    return [
      {
        // NOTE: some bugs have multiple test files, or no test file at all
        testFilePaths: ['./test/app.param.js'],
        runArgs: [
          "--grep",
          "should defer all the param routes",
          "--",
          "./test/app.param.js"
        ],
        id: 27,
        name: 'express bug 27'
      }
    ];
  }

  async selectBug(bug) {
    const {
      id, name
    } = bug;
    const tagCategory = "test"; // "test", "fix" or "full"

    // checkout the bug branch
    debug(`Checking out bug ${name || id}...`);
    exec(`git checkout "tags/Bug-${id}-${tagCategory}"`);
  }
}