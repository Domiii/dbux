import isString from 'lodash/isString';
import { getPresentableString } from '../helpers/pathHelpers';
import ParseRegistry from './ParseRegistry';

/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("./ParseStack").default } ParseStack */

export default class ParseNode {
  /**
   * @type {NodePath}
   */
  enterPath;
  state;

  /**
   * @type {ParseStack}
   */
  stack;

  /**
   * @type {{ [string]: object }}
   */
  plugins = {};

  /**
   * 
   * @param {NodePath} path 
   * @param {ParseStack} stack 
   */
  constructor(path, state, stack, initialData) {
    this.enterPath = path;
    this.state = state;
    this.stack = stack;
    this.data = initialData === true ? {} : initialData;

    this.recordedDepth = stack.recordedDepth;
    this.nodeId = ++stack.lastId;
  }

  /**
   * @type {NodePath}
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

  getPlugin(pluginNameOrClazz) {
    const pluginName = isString(pluginNameOrClazz) ? pluginNameOrClazz : pluginNameOrClazz.name;
    return this.plugins[pluginName] || null;
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

  enterPlugins() {
    for (const name in this.plugins) {
      this.plugins[name].enter?.(this);
    }
  }

  exitPlugins() {
    for (const name in this.plugins) {
      this.plugins[name].exit?.(this);
    }
  }

  exit() {
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  addPlugin(Clazz) {
    const plugin = new Clazz();
    plugin.parseNode = this;
    plugin.init?.();
    this.plugins[Clazz.name] = plugin;
    return plugin;
  }

  createPlugins() {
    const { PluginClassesByName } = ParseRegistry;
    for (const h of this.pluginNames) {
      let predicate, helperName;
      if (Array.isArray(h)) {
        [predicate, helperName] = h;
      }
      else {
        helperName = h;
      }

      if (!predicate || predicate()) {
        const HelperClazz = PluginClassesByName[helperName];
        if (!HelperClazz) {
          throw new Error(`${this} referenced non-existing helperName = "${helperName}" (available: ${Object.keys(PluginClassesByName).join(', ')})`);
        }
        this.addPlugin(HelperClazz);
      }
    }
    return this.plugins;
  }

  // ###########################################################################
  // static members
  // ###########################################################################

  get nodeNames() {
    return this.constructor.nodeNames;
  }
  get pluginNames() {
    return this.constructor.pluginNames;
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