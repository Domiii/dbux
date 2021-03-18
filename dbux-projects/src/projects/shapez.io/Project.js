
import path from 'path';
import sh from 'shelljs';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
// import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Bug').default} Bug */

export default class ShapezIoProject extends Project {
  gitRemote = 'chartjs/Chart.js.git';
  // https://github.com/chartjs/Chart.js/releases/tag/v3.0.0-beta.13
  gitCommit = 'tags/v3.0.0-beta.13';

  packageManager = 'npm';

  async installDependencies() {
    // TODO pre-install: https://github.com/tobspr/shapez.io/blob/master/.travis.yml#L129
  }

  // TODO
}