import { isPassedTypes } from '@dbux/projects/src/dataLib/ExerciseStatus';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import ExerciseNode from './ExerciseNode';

/** @typedef {import('@dbux/projects/src/projectLib/Chapter').default} Chapter */

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

export default class ChapterNode extends BaseTreeViewNode {
  static makeLabel({ id, name }) {
    return `Chapter ${id}: ${name}`;
  }

  /**
   * @type {Chapter}
   */
  get chapter() {
    return this.entry;
  }

  get description() {
    const totalExercisesCount = this.chapter.exercises.length;
    const solvedExercisesCount = this.solvedExercises.length;
    return `(${solvedExercisesCount}/${totalExercisesCount})`;
  }

  get solvedExercises() {
    return this.chapter.exercises.getAll().filter(e => {
      const progress = this.manager.exerciseDataProvider.getExerciseProgressByExercise(e);
      return isPassedTypes(progress?.status);
    });
  }

  /**
   * @type {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get contextValue() {
    return `dbuxProjectView.chapterNode`;
  }

  makeIconPath() {
    if (this.solvedExercises.length === this.chapter.exercises.length) {
      return 'correct_bw.svg';
    }
    else {
      return '';
    }
  }

  buildChildren() {
    const exercises = this.chapter.exercises.getAll();
    return exercises.map(this.buildExerciseNode.bind(this));
  }

  buildExerciseNode(exercise) {
    return this.treeNodeProvider.buildNode(ExerciseNode, exercise, this);
  }
}