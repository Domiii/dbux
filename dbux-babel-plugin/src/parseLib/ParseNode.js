import { getPresentableString } from '../helpers/pathHelpers';

/** @typedef { import("@babel/traverse").NodePath } Path */

export default class ParseNode {
  /**
   * @type {string[]}
   */
  featureNames;

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
    return `${this.constructor.name}: ${getPresentableString(this.enterPath)}`;
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

  addFeature(Clazz) {
    const feature = new Clazz();
    feature.parseNode = this;
    feature.init?.();
    this.helpers[Clazz.name] = feature;
    return feature;
  }

  createFeatures() {
    const { FeatureClassesByName } = ParseNode;
    for (const h of this.featureNames) {
      let predicate, helperName;
      if (Array.isArray(h)) {
        [predicate, helperName] = h;
      }
      else {
        helperName = h;
      }

      if (!predicate || predicate()) {
        const HelperClazz = FeatureClassesByName[helperName];
        if (!HelperClazz) {
          throw new Error(`${this} referenced non-existing helperName = "${helperName}" (available: ${Object.keys(FeatureClassesByName).join(', ')})`);
        }
        this.addFeature(HelperClazz);
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
  get featureNames() {
    return this.constructor.featureNames;
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

  static FeatureClassesByName;
}