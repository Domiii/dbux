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

    // add "attach to node" `launch.json` entry
    /*
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to any node program",
      "port": 9229
    }
    */

    // TODO


    // add instrumentation (w/ webpack)
    // TODO
  }

  async loadBugs() {
    // TODO!
    return [
      {
        mainFilePath: './test/app.param.js',
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
    const bugId = bug.id;
    const tagCategory = "test"; // "test", "fix" or "full"

    // checkout the bug branch
    exec(`git checkout "tags/Bug-${bugId}-${tagCategory}"`);
  }
}