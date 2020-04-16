import sh from 'shelljs';
import exec from 'dbux-projects/src/util/exec';


// ###########################################################################
// manage dbux files
// ###########################################################################

export async function installDbuxCli(projectPath) {
  sh.cd(projectPath);

  // TODO: make this work in production as well

  await exec('yarn add ../../dbux-cli');
}