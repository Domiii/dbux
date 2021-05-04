import { pathToStringSimple } from '../helpers/pathHelpers';

export default class ParseNode {
  constructor(path, state, initialData) {
    this.enterPath = path;
    this.state = state;
    this.data = initialData === true ? {} : initialData;
  }

  get path() {
    return this.enterPath;
  }

  init() { }

  // static get prop() {
  //   return 
  // }

  get debugTag() {
    return this.toString();
  }

  toString() {
    return `${this.constructor.name}: ${pathToStringSimple(this.enterPath)}`;
  }

  // ###########################################################################
  // enter + exit
  // ###########################################################################
  
  enter() {
  }

  exit() {
  }

  // ###########################################################################
  // static members
  // ###########################################################################

  get nodeNames() {
    return this.constructor.nodeNames;
  }
  get logger() {
    return this.constructor.logger;
  }

  static nodeNames = [];

  /**
   * @returns `false`, `true` or some initial state (which will be stored in `data`)
   */
  static prospectOnEnter(/* path, state */) {
    return true;
  }
}