import isString from 'lodash/isString';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import NestedError from '@dbux/common/src/NestedError';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { pathToString, pathToStringAnnotated } from '../helpers/pathHelpers';
import ParseRegistry from './ParseRegistry';
import { getChildPaths, getNodeOfPath } from './parseUtil';
import ParsePhase from './ParsePhase';

/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("./ParseStack").default } ParseStack */
/** @typedef { import("./ParsePlugin").default } ParsePlugin */
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
   * @type {{ [string]: ParsePlugin }}
   */
  plugins = {};
  // /**
  //  * Array of plugins, in order of initialization.
  //  */
  pluginList = [];
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

  get depth() {
    return this.recordedDepth;
  }

  getAllClassPlugins() {
    // if (!this.constructor._pluginConfigs) {
    //   const allPluginConfigs = ParseRegistry.getAllPluginConfigsOfNodeClass(this.constructor, this);
    //   this.constructor._pluginConfigs = allPluginConfigs;
    // }
    // return this.constructor._pluginConfigs;
    return ParseRegistry.getAllPluginConfigsOfNodeClass(this.constructor, this);
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
    const pluginName = isString(pluginNameOrClazz) ? 
      pluginNameOrClazz : 
      (pluginNameOrClazz.nameOverride || pluginNameOrClazz.name);
    return this.plugins[pluginName] || null;
  }

  // ###########################################################################
  // children + parent getters
  // ###########################################################################

  /**
   * Gets all child paths. 
   * NOTE: You can choose to ommit optional missing children, but optional children are rare.
   * @param {boolean} addEmpty Whether to include optional missing paths (e.g. VariableDeclarator.init)
   * @returns {Array.<NodePath | Array.<NodePath>>}
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

  /**
   * @returns {ParseNode}
   */
  getNodeOfPath = path => {
    return getNodeOfPath(path);
  }

  /**
   * @returns {ParseNode[]}
   */
  getChildNodes() {
    if (this.phase < ParsePhase.Exit1) {
      // TODO: fix this
      const thisString = pathToStringAnnotated(this.path, true);
      throw new Error(`Cannot getChildNodes before Exit or Instrument phases (phase = ${ParsePhase.nameFromForce(this.phase)}) - ${thisString}`);
    }
    // NOTE: cache _childNodes
    this._childNodes = this._childNodes || this.getChildPaths().map(this.getNodeOfPath);
    return this._childNodes;
  }

  getParent() {
    return this.getNodeOfPath(this.path.parentPath);
  }

  getExistingParent() {
    let { path } = this;
    let parent = null;
    // eslint-disable-next-line no-empty
    while ((path = path.parentPath) && !(parent = this.getNodeOfPath(path))) { }
    return parent;
  }

  /**
   * Goal: get a string representation of parent.
   * If parent AST node does not have a `ParseNode`, get path representation instead.
   */
  getParentString() {
    let parent = this.getParent();
    if (!parent) {
      // 
      const { parentPath } = this.path;
      if (parentPath) {
        return `[${parentPath.node.type}] ${pathToString(parentPath)}`;
      }
    }
    return parent?.toString();
  }


  // ###########################################################################
  // stack
  // ###########################################################################

  /**
   * NOTE: we use this because the {@link ParseStack} does not maintain this structure forever.
   */
  getParseNodeStack() {
    const arr = [];
    let { path } = this;
    do {
      arr.push([path, this.getNodeOfPath(path)]);
      path = path.parentPath;
    } while (path);
    return arr;
  }

  getParseNodeStackToString() {
    const stack = this.getParseNodeStack();
    const indent = '    ';
    return ` - Node stack (${stack.length}):\n${indent}` +
      stack.map(([path, node]) => `${node}${!node ? ` ${path?.node && pathToString(path) || '(null)'}` : ''}`).join(`\n${indent}`);
  }


  // ###########################################################################
  // more ancestry logic (NOTE: cannot use ParseStack, since stack structure disappears after `exit1`)
  // ###########################################################################

  /**
   * @return {ParseNode} The first ancestor of given type.
   */
  peekNode(nameOrParseNodeClazz) {
    const Clazz = isString(nameOrParseNodeClazz) ?
      ParseRegistry.getNodeClassByName(nameOrParseNodeClazz) :
      nameOrParseNodeClazz;

    // TODO: why not use ParseStack._peekNode instead?

    let current = this;
    let { path } = this;
    while (path && !(current instanceof Clazz)) {
      path = path.parentPath;
      path && (current = this.getNodeOfPath(path));
    }
    return current;
  }

  /**
   * @return {ParseNode} The first ancestor of given type. Throws error if none found.
   */
  peekNodeForce(nameOrParseNodeClazz) {
    const node = this.peekNode(nameOrParseNodeClazz);
    if (!node) {
      this._nodeFail(`Node "${nameOrParseNodeClazz?.name || nameOrParseNodeClazz}" not found on stack`);
    }
    return node;
  }

  /**
   * @return {ParsePlugin} The plugin of the first ancestor node that has the given `pluginNameOrClazz`.
   */
  peekPlugin(pluginNameOrClazz) {
    let current = this;
    let { path } = this;
    let plugin;
    while (path && !(plugin = current?.getPlugin(pluginNameOrClazz))) {
      path = path.parentPath;
      path && (current = this.getNodeOfPath(path));
    }
    return plugin;
  }

  peekPluginForce(pluginNameOrClazz) {
    const node = this.peekPlugin(pluginNameOrClazz);
    if (!node) {
      this._nodeFail(`Plugin "${pluginNameOrClazz?.name || pluginNameOrClazz}" not found on stack`);
    }
    return node;
  }

  _nodeFail(msg) {
    throw new Error(
      `${msg}${this.getParseNodeStackToString()}\n`
    );
  }

  // ###########################################################################
  // debugging
  // ###########################################################################

  get Verbose() {
    return this.stack.Verbose;
  }

  get VerboseDecl() {
    return this.stack.VerboseDecl;
  }

  debug(...args) {
    return this.stack.debug(' >', `[${this.debugTag}]`, ...args);
  }

  warn(...args) {
    return this.stack.warn(' >', `[${this.debugTag}]`, ...args);
  }

  debugDecl(fn) {
    this.Verbose
  }

  get debugTag() {
    return this.toString();
  }

  get verboseDebugTag() {
    const loc = this.path?.node?.loc;
    const locStr = `${this.state.filePath}:${loc ? `${loc.start.line}:${loc.start.end}` : '?'}`;
    return `[${this.nodeTypeName}] "${pathToString(this.enterPath)}" in "${locStr}"`;
  }

  toString() {
    return `[${this.nodeTypeName}] ${pathToString(this.enterPath)}`;
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
      for (const plugin of this.pluginList) {
        const f = plugin[phase];
        // this.debug(` [P] ${name}`, !!f);
        if (f) {
          this.Verbose > 2 && this.debug(`[P] ${plugin.name}`);
          f.call(plugin);
        }
      }
    };
  }

  addPlugin(Clazz, cfg = EmptyObject) {
    const plugin = new Clazz();
    plugin.node = this;
    plugin.init?.(cfg);
    const name = Clazz.nameOverride || Clazz.name;
    this.plugins[name] = plugin;
    this.pluginList.push(plugin);
    if (cfg.alias) {
      if (this.plugins[cfg.alias]) {
        throw new Error(`Plugin config's "alias" conflict: already used - ${cfg.alias} in "${this}"`);
      }
      this.plugins[cfg.alias] = plugin;
    }
    return plugin;
  }

  initPlugins() {
    // add plugins
    for (let [/* name */, { PluginClazz, ...cfg }] of this.getAllClassPlugins().entries()) {
      // this.debug(this.nodeTypeName, `[initPlugins] add`, name, !predicate || predicate());

      // add plugin
      try {
        this.addPlugin(PluginClazz, cfg);
      }
      catch (err) {
        throw new NestedError(`Failed to addPlugin "${PluginClazz?.name || PluginClazz}" to node "${this}"`, err);
      }
    }

    // add plugin phases conditionally
    for (const phase of PhaseMethodNames) {
      if (this.pluginList.some(p => p[phase])) {
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