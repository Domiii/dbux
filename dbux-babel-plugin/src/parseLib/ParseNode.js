import isString from 'lodash/isString';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { Logger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../helpers/pathHelpers';
import ParseRegistry from './ParseRegistry';
import { getChildPaths, getNodeOfPath } from './parseUtil';
import ParsePhase from './ParsePhase';
import NestedError from '@dbux/common/src/NestedError';

/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("./ParseStack").default } ParseStack */
/** @typedef { import("@dbux/common/src/log/logger").Logger } Logger */

const PhaseMethodNames = ParsePhase.names.map(name => name.toLowerCase());

export default class ParseNode {
  /**
   * @type {number}
   */
  phase = ParsePhase.Init;

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
  pluginPhases = {};

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

  getAllClassPlugins() {
    if (!this.constructor._pluginConfigs) {
      const allPluginConfigs = ParseRegistry.getAllPluginConfigsOfNodeClass(this.constructor);
      this.constructor._pluginConfigs = Array.from(allPluginConfigs.values());
    }
    return this.constructor._pluginConfigs;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get name() {
    return this.constructor.name;
  }

  /**
   * @type {NodePath}
   */
  get path() {
    return this.enterPath;
  }

  /**
   * @type {import('@babel/types').Node}
   */
  get astNode() {
    return this.path.node;
  }

  get nodeTypeName() {
    return this.constructor.name;
  }

  // static get prop() {
  //   return 
  // }

  getPlugin(pluginNameOrClazz) {
    const pluginName = isString(pluginNameOrClazz) ? pluginNameOrClazz : pluginNameOrClazz.name;
    return this.plugins[pluginName] || null;
  }

  toString() {
    return `[${this.nodeTypeName}] ${getPresentableString(this.enterPath)}`;
  }

  // ###########################################################################
  // children utilities
  // ###########################################################################

  /**
   * Gets all child paths. 
   * NOTE: You can choose to ommit optional missing children, but optional children are rare.
   * @param {boolean} addEmpty Whether to include optional missing paths (e.g. VariableDeclarator.init)
   */
  getChildPaths(addEmpty = true) {
    const { children } = this.constructor;
    if (!children) {
      throw new Error(`Could not getChildPaths - missing \`static children\` in ${this}.`);
    }
    // NOTE: cache _childPaths
    this._childPaths = this._childPaths || getChildPaths(this.path, children, addEmpty);
    return this._childPaths;
  }

  getNodeOfPath = path => {
    return getNodeOfPath(path);
  }

  getChildNodes() {
    if (this.phase < ParsePhase.Exit1) {
      throw new Error(`Cannot getChildNodes before Exit or Instrument phases - ${this} (${ParsePhase.nameFromForce(this.phase)})`);
    }
    // NOTE: cache _childNodes
    this._childNodes = this._childNodes || this.getChildPaths().map(this.getNodeOfPath);
    return this._childNodes;
  }

  // ###########################################################################
  // debugging
  // ###########################################################################

  get Verbose() {
    return this.stack.Verbose;
  }

  debug(...args) {
    return this.stack.debug(' >', ...args);
  }

  warn(...args) {
    return this.stack.warn(' >', ...args);
  }

  get debugTag() {
    return this.toString();
  }

  // ###########################################################################
  // lifecycle methods
  // ###########################################################################

  hasPhase(...phases) {
    return phases.some(p => this[p] || this.pluginPhases[p]);
  }

  init() { }

  enterPlugins() {
    this.pluginPhases.enter?.();
  }

  exit1Plugins() {
    this.pluginPhases.exit1?.();
  }

  exitPlugins() {
    this.pluginPhases.exit?.();
  }

  instrument1Plugins() {
    this.pluginPhases.instrument1?.();
  }

  instrumentPlugins() {
    this.pluginPhases.instrument?.();
  }

  // enter() {
  // }

  // exit1() {
  // }

  // exit() {
  // }

  // instrument1() {
  // }

  // instrument() {
  // }

  // ###########################################################################
  // plugins
  // ###########################################################################

  makePluginPhase(phase) {
    this.pluginPhases[phase] = () => {
      for (const name in this.plugins) {
        const plugin = this.plugins[name];
        const f = plugin[phase];
        // this.debug(` [P] ${name}`, !!f);
        if (f) {
          this.debug(`[P] ${name}`);
          f.call(plugin);
        }
      }
    };
  }

  addPlugin(Clazz) {
    const plugin = new Clazz();
    plugin.node = this;
    plugin.init?.();
    this.plugins[Clazz.name] = plugin;
    return plugin;
  }

  initPlugins() {
    // add plugins (possibly conditionally)
    for (const pluginCfg of this.getAllClassPlugins()) {
      let predicate, name;
      if (Array.isArray(pluginCfg)) {
        [predicate, name] = pluginCfg;
      }
      else {
        name = pluginCfg;
      }

      // this.debug(this.nodeTypeName, `[initPlugins] add`, name, !predicate || predicate());

      if (!predicate || predicate()) {
        // add plugin
        try {
          this.addPlugin(ParseRegistry.getPluginClassByName(name));
        }
        catch (err) {
          throw new NestedError(`Failed to addPlugin "${name}" to node "${this}"`, err);
        }
      }
    }

    // add plugin phases conditionally
    const pluginArray = Object.values(this.plugins);
    for (const phase of PhaseMethodNames) {
      if (pluginArray.some(p => p[phase])) {
        this.makePluginPhase(phase);
      }
    }
    return this.plugins;
  }

  // ###########################################################################
  // static members
  // ###########################################################################

  get children() {
    return this.constructor.children;
  }
  get pluginConfigs() {
    return this.constructor.plugin;
  }

  /**
   * @type {Logger}
   */
  get logger() {
    return this.constructor.logger;
  }

  static children = [];

  /**
   * @returns `false`, `true` or some initial state (which will be stored in `data`)
   */
  static prospectOnEnter(/* path, state */) {
    return true;
  }
}