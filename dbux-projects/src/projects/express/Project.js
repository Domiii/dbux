import path from 'path';
import spawn from 'child_process';
import sh from 'shelljs';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import { newLogger } from 'dbux-common/src/log/logger';
import exec from 'dbux-projects/src/util/exec';
import Project from 'dbux-projects/src/projectLib/Project';
import { installDbuxCli } from 'dbux-projects/src/projectLib/installUtil';


const { log, debug, warn, error: logError } = newLogger('dbux-projects/Project');

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

export default class ExpressProject extends Project {
  githubUrl = 'https://github.com/BugsJS/express.git';

  async installProject() {
    const {
      projectsRoot,
      projectPath,
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

    // install dependencies
    sh.cd(projectPath);
    await installDbuxCli();

    // TODO: copy assets
    // sh.cp('-u', src, dst);


    // TODO: start webpack if necessary
    // TODO: manage/expose (webpack) bug background process
  }

  async loadBugs() {
    // TODO: load automatically from BugsJs bug database
    const testFilePaths = ['./test/app.param.js'];
    return [
      {
        // NOTE: some bugs have multiple test files, or no test file at all
        testFilePaths,
        runArgs: [
          '--grep',
          '"should defer all the param routes"',
          '--',
          ...testFilePaths
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

  async testBug(bug, debugPort) {
    const {
      projectPath
    } = this;
    // NOTE: NYC uses either of the following:
    //  1. simple 
    //    - node-preload - https://www.npmjs.com/package/node-preload ("Request that Node.js child processes preload modules")
    //    - process-on-spawn - 
    //  2. wrapped
    //    - spawn-wrap - https://github.com/istanbuljs/spawn-wrap ("brutal hack [...] in cases where tests or the system under test are loaded via child processes rather than via require(). [...] any child processes launched by that child process will also be wrapped.")

    // const cwd = ;
    const dbuxRegister = `${projectPath}/node_modules/.bin/dbux-register`;
    const program = `${projectPath}/node_modules/.bin/_mocha`;
    const argArray = [
      ...(bug.runArgs || EmptyArray)
    ];
    const args = argArray.join(' ');      //.map(s => `"${s}"`).join(' ');

    // cd ...
    // TODO: spawn, listen on and process on-going process
    //    see https://stackoverflow.com/questions/14332721/node-js-spawn-child-process-and-get-terminal-output-live
    const requireArr = [
      path.join(projectPath, 'test/support/env'),
      dbuxRegister
    ];
    const reqs = requireArr.map(r => `--require="${r}"`).join(' '); // =${debugPort}
    const cmd = `node --stack-trace-limit=1000 --nolazy --inspect-brk=${debugPort} ${reqs} "${program}" ${args}`;
    const commandOptions = {
      cwd: projectPath
    };
    sh.cd(projectPath);


    if (argArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug` arguments must not include `undefined`: ' + cmd);
    }

    debug('>', cmd);

    const processLogger = newLogger(`Project ${this.name}`);
    return new Promise((resolve, reject) => {
      const child = spawn.exec(cmd, commandOptions, function (err, stdout, stderr) {
        if (!err) {
          resolve();
        }
        else {
          err.code = err.code || 1;
          reject(err);
        }
      });
      child.stdout.on('data', (...chunks) => {
        processLogger.debug(...chunks);
      });
      child.stderr.on('data', (...chunks) => {
        processLogger.warn(...chunks);
      });
    });


    // TODO: enable auto attach (run command? or remind user?)
    //      see: https://code.visualstudio.com/blogs/2018/07/12/introducing-logpoints-and-auto-attach
    /*
    "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/_mocha",
      "runtimeArgs": [
        "--stack-trace-limit=1000",
        "--preserve-symlinks"
      ],
      "cwd": "${workspaceFolder}",
      "args": [
        // "--reporter=json",
      ],
      */
  }
}