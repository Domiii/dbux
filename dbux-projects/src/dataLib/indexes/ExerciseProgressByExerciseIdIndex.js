import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';
import ExerciseProgress from '../ExerciseProgress';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<ExerciseProgress>} */
export default class ExerciseProgressByExerciseIdIndex extends CollectionIndex {
  constructor() {
    super('exerciseProgresses', 'byExerciseId', { isMap: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {ExerciseProgress} exerciseProgress
   */
  makeKey(pdp, exerciseProgress) {
    return exerciseProgress.exerciseId;
  }
}