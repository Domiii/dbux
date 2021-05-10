import { pathToStringSimple } from '../helpers/pathHelpers';

/** @typedef { import("@babel/traverse").NodePath } Path */

export default class ParseNode {
  /**
   * @type {string[]}
   */
  helperNames;

  /**
   * @type {{ [string]: object }}
   */
  helpers = {};

  constructor(path, state, stack, initialData) {
    this.enterPath = path;
    this.state = state;
    this.stack = stack;
    this.data = initialData === true ? {} : initialData;
  }

  /**
   * @type {Path}
   */
  get path() {
    return this.enterPath;
  }

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
  // lifecycle methods
  // ###########################################################################

  init() { }

  enter() {
  }

  exit() {
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  addHelper(Clazz) {
    const helper = new Clazz();
    helper.parseNode = this;
    helper.init?.();
    this.helpers[Clazz.name] = helper;
    return helper;
  }

  createHelpers() {
    for (const h of this.helperNames) {
      let predicate, helperName;
      if (Array.isArray(h)) {
        [predicate, helperName] = h;
      }
      else {
        helperName = h;
      }

      if (!predicate || predicate()) {
        const HelperClazz = ParseNode.HelperClassesByName[helperName];
        if (!HelperClazz) {
          throw new Error(`${this} referenced non-existing helperName = "${helperName}" (available: ${Object.keys(HelperClassesByName).join(', ')})`);
        }
        this.addHelper(HelperClazz);
      }
    }
    return this.helpers;
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

  static HelperClassesByName;
}