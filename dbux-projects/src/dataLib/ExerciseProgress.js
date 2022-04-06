import ExerciseStatus from './ExerciseStatus';

export default class ExerciseProgress {
  constructor(exercise, stopwatchEnabled) {
    const timeStamp = Date.now();
    this.projectName = exercise.project.name;
    this.exerciseId = exercise.id;
    this.createdAt = timeStamp;
    this.updatedAt = timeStamp;
    /**
     * @type {number|null}
     */
    this.startedAt = null;
    /**
     * @type {number|null}
     */
    this.solvedAt = null;
    this.stopwatchEnabled = stopwatchEnabled;
    /**
     * @type {number}
     */
    this.status = ExerciseStatus.Solving;
    this.patch = '';
  }
}