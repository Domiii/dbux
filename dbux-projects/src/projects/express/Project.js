import path from 'path';
import sh from 'shelljs';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import exec from 'dbux-projects/src/util/exec';
import Project from 'dbux-projects/src/projectLib/Project';


export default class ExpressProject extends Project {
  githubUrl = 'https://github.com/BugsJS/express.git';

  async installDependencies() {
    // # yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
    // # yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
    // # yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime
  }

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
    if (!await sh.test('-d', projectPath)) {
      this.log(`Cloning from "${githubUrl}"\n  in "${curDir}"...`);
      // project does not exist yet
      await exec(`git clone ${githubUrl} ${projectPath}`, this.logger);
      // log('  ->', result.err || result.out);
      // (result.err && warn || log)('  ->', result.err || result.out);
      this.log(`Cloned.`);
    }
    else {
      this.log('(skipped cloning)');
    }

    // install
    await this.npmInstall();

    // install dbux dependencies
    await this.installDbuxCli();

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
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || id}...`);
    await exec(`git checkout "tags/Bug-${id}-${tagCategory}"`, this.logger);
  }

  async testBugCommand(bug, debugPort) {
    const {
      projectPath
    } = this;
    
    // cwd
    sh.cd(projectPath);

    // NOTE: depending on the mode, NYC uses either of the following:
    //  1. simple 
    //    - node-preload - https://www.npmjs.com/package/node-preload ("Request that Node.js child processes preload modules")
    //    - process-on-spawn - 
    //  2. wrapped
    //    - spawn-wrap - https://github.com/istanbuljs/spawn-wrap ("brutal hack [...] in cases where tests or the system under test are loaded via child processes rather than via require(). [...] any child processes launched by that child process will also be wrapped.")

    // TODO: get rid of monoroot dependencies to prepare for deployment
    const MonoRoot = path.resolve(projectPath, '../..');
    const dbuxRegister = `${MonoRoot}/node_modules/dbux-cli/bin/dbux-register.js`;
    const program = `${projectPath}/node_modules/mocha/bin/_mocha`;

    const defaultArgs = `--stack-trace-limit=1000 --nolazy`;
    const debugArgs = debugPort && `--inspect-brk=${debugPort}` || '';

    // pre-load some modules
    const requireArr = [
      path.join(projectPath, 'test/support/env'),
      dbuxRegister
    ];
    const reqs = requireArr.map(r => `--require="${r}"`).join(' ');

    // args
    const argArray = [
      ...(bug.runArgs || EmptyArray)
    ];
    if (argArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug` arguments must not include `undefined`: ' + cmd);
    }
    const args = argArray.join(' ');      //.map(s => `"${s}"`).join(' ');
    
    // final result
    return `node ${defaultArgs} ${debugArgs} ${reqs} "${program}" ${args}`;


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