
import path from 'path';
import sh from 'shelljs';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
// import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Exercise').default} Bug */

export default class ShapezIoProject extends Project {
  gitRemote = 'TODO';
  gitCommit = '';

  packageManager = 'npm';

  async installDependencies() {
    // TODO pre-install: https://github.com/tobspr/shapez.io/blob/master/.travis.yml#L129
  }

  // TODO
}