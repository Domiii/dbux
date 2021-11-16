export default class ExerciseProgress {
  constructor(exercise, status, stopwatchEnabled) {
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
    this.status = status;
    this.patch = '';
  }
}