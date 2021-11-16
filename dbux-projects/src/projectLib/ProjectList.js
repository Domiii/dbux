import Project from './Project';

export default class ProjectList {
  /**
   * @type {Project[]}
   */
  _list = [];
  /**
   * @type {Map.<string, Project>}
   */
  _map = new Map();

  _exerciseByIdMap;

  constructor(manager) {
    this.manager = manager;
    this._exerciseByIdMap = new Map();
  }

  /**
   * @param {Project[]} projects
   */
  add(...projects) {
    projects.forEach((project) => {
      const exercises = Array.from(project.getOrLoadExercises());
      exercises.forEach(exercise => {
        if (!exercise) {
          debugger;
        }
        this._exerciseByIdMap.set(exercise.id, exercise);
      }
      );

      this._map.set(project.name, project);
      this._list.push(project);
    });
  }

  getAt(i) {
    return this._list[i];
  }

  /**
   * @param {string} name 
   * @return {Project}
   */
  getByName(name) {
    return this._map.get(name);
  }

  getExerciseById(exerciseId) {
    return this._exerciseByIdMap.get(exerciseId);
  }

  *[Symbol.iterator]() {
    yield* this._list;
  }
}