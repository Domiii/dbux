import { env, Uri } from 'vscode';
import ExerciseStatus from '@dbux/projects/src/dataLib/ExerciseStatus';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import { showInformationMessage } from '../../codeUtil/codeModals';
import { emitOpenWebsiteAction } from '../../userEvents';
import cleanUp from './cleanUp';

/** @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise */
/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */
/** @typedef {import('./ProjectNode').default} ProjectNode */

export default class ExerciseNode extends BaseTreeViewNode {
  /**
   * @param {Exercise} exercise 
   */
  static makeLabel(exercise) {
    return exercise.label;
  }

  init = () => {
    const { id } = this.exercise;
    // this.description = `${description}${number && ` #${number}` || ''}`;
    this.description = id;
  }

  /**
   * @return {Exercise}
   */
  get exercise() {
    return this.entry;
  }

  /**
   * @return {ProjectNode}
   */
  get projectNode() {
    return this.parent;
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get contextValue() {
    const runStatus = RunStatus.getName(this.exercise.runStatus);
    const hasWebsite = this.exercise.website ? 'hasWebsite' : '';
    return `dbuxProjectView.exerciseNode.${runStatus}.${hasWebsite}`;
  }

  makeIconPath() {
    switch (this.exercise.runStatus) {
      case RunStatus.Busy:
        return 'hourglass.svg';
      case RunStatus.RunningInBackground:
        return 'play.svg';
    }
    const progress = this.manager.bdp.getExerciseProgress(this.exercise.id);
    switch (progress?.status) {
      case ExerciseStatus.Solving:
        return progress.stopwatchEnabled ? 'edit.svg' : 'edit.svg';
      case ExerciseStatus.Attempted:
        return progress.stopwatchEnabled ? 'wrong.svg' : 'wrong_bw.svg';
      case ExerciseStatus.Found:
        return progress.stopwatchEnabled ? 'correct.svg' : 'correct_bw.svg';
      case ExerciseStatus.Solved:
        return progress.stopwatchEnabled ? 'correct.svg' : 'correct_bw.svg';
    }
    return ' ';
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }

  async showWebsite() {
    const url = this.exercise.website;
    if (url) {
      emitOpenWebsiteAction(url);
      return env.openExternal(Uri.parse(url));
    }

    return false;
  }

  async tryResetExercise() {
    try {
      if (await this.manager.exitPracticeSession()) {
        await this.manager.resetExercise(this.exercise);
        await showInformationMessage(`Exercise "${this.exercise.id}" has been reset successfully.`);
      }
    }
    catch (err) {
      if (err.userCanceled) {
        await showInformationMessage('Action canceled.');
      }
      else {
        throw err;
      }
    }
  }

  async showExerciseIntroduction() {
    await this.exercise.manager.externals.showExerciseIntroduction(this.exercise);
  }

  async showExerciseLog() {
    await this.exercise.manager.showExerciseLog(this.exercise);
  }

  async cleanUp() {
    await cleanUp(this.treeNodeProvider, this.exercise.project);
  }
}