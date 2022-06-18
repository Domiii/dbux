import ExerciseList from './ExerciseList';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./Exercise').default} Exercise */

export default class Chapter {
  /**
   * @param {ProjectsManager} manager 
   * @param {number} id 
   * @param {string} name 
   * @param {Exercise[]} exercises 
   */
  constructor(manager, id, name, exercises, cfg) {
    this.manager = manager;
    this.name = name;
    this.id = id;
    this.exercises = new ExerciseList(exercises);
    Object.assign(this, cfg);
  }
}