import isString from 'lodash/isString';
import maxBy from 'lodash/maxBy';
import { newLogger } from '@dbux/common/src/log/logger';
import { getNodeOfPath, setNodeOfPath } from './parseUtil';
import { getPresentableString } from '../helpers/pathHelpers';
import ParseRegistry from './ParseRegistry';
import ParsePhase from './ParsePhase';

/** @typedef { import("./ParseNode").default } ParseNode */

const Verbose = 2;
// const Verbose = 0;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Stack');

function debugTag(obj) {
  return obj.debugTag || obj.name || obj.toString();
}

/**
 * Track read and write dependencies as we move through the AST.
 */
export default class ParseStack {
  _stack = new Map();
  genTasks = [];
  isGen = false;
  /**
   * This is the depth of the stack, given the observed enters and exits.
   * NOTE: This does not represent the actual depth of the AST, since we are not visiting all AST nodes.
   */
  recordedDepth = 0;
  lastId = 0;

  constructor(state) {
    this.state = state;
    this.logger = newLogger(`Stack`);
    Verbose && this.logger.debug(`${state.fileName}`);
  }

  get Verbose() {
    return Verbose;
  }

  debug(arg0, ...args) {
    this.logger.debug(`${' '.repeat(this.recordedDepth)}${arg0}`, ...args);
  }

  warn(arg0, ...args) {
    this.logger.warn(`${' '.repeat(this.recordedDepth)}${arg0}`, ...args);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  /**
  // TODO: fix peekNode, peekNodePlugin to just use `parentPath`, instead of trying to decipher stack?
   * @return {ParseNode}
   */
  peekNode(nameOrParseNodeClazz) {
    const name = isString(nameOrParseNodeClazz) ? nameOrParseNodeClazz : nameOrParseNodeClazz.name;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    if (nodesOfType?.length) {
      return nodesOfType[nodesOfType.length - 1];
    }
    return null;
  }

  getNodeOfPath(path) {
    return getNodeOfPath(path);
  }

  /**
   * @return {ParseNode}
   */
  peekNodeOfPlugin(pluginNameOrClazz) {
    const pluginName = isString(pluginNameOrClazz) ?
      pluginNameOrClazz :
      pluginNameOrClazz.name;
    try {
      const nodeNames = ParseRegistry.getParseNodeNamesOfPluginName(pluginName);
      if (!nodeNames) {
        return null;
      }

      // Of all candidate node types, peek the stack top, and of those take the last one created.
      return maxBy(
        nodeNames.map(name => this.peekNode(name)),
        node => node?.nodeId || -1
      );
    }
    catch (err) {
      throw new Error(`peekNodeOfPlugin failed for "${pluginName}" - ${err.stack}`);
    }
  }

  peekPlugin(pluginNameOrClazz) {
    const node = this.peekNodeOfPlugin(pluginNameOrClazz);
    return node?.getPlugin(pluginNameOrClazz);
  }

  // ###########################################################################
  // push + pop
  // ###########################################################################

  push(ParseNodeClazz, newNode) {
    const { name } = ParseNodeClazz;
    if (!name) {
      throw new Error(`\`static name\` is missing on ParseNode class: ${debugTag(ParseNodeClazz)}`);
    }

    const { _stack } = this;
    let nodesOfType = _stack.get(name);
    if (!nodesOfType) {
      _stack.set(name, nodesOfType = []);
    }
    (Verbose >= 3) && this.debug(`push ${name}`);
    nodesOfType.push(newNode);
  }

  pop(path, ParseNodeClazz) {
    const { name } = ParseNodeClazz;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    (Verbose >= 3) && this.debug(`pop ${name}`);
    const node = nodesOfType.pop();
    if (node.path !== path) {
      throw new Error(`ParseStack corrupted - exit path does not match stack node (of type ${name}) - ${getPresentableString(path)}`);
    }
    return node;
  }

  // ###########################################################################
  // createOnEnter
  // ###########################################################################

  /**
   * @return {ParseNode}
   */
  createOnEnter(path, state, ParseNodeClazz) {
    /**
     * @type {ParseNode}
     */
    let newNode = null;
    const initialData = ParseNodeClazz.prospectOnEnter(path, state);
    if (initialData) {
      if (getNodeOfPath(path)) {
        // TODO: this is definitely going to happen. need to fix this somehow
        this.logger.warn(
          `Path has more than one matching node type: ` +
          `${newNode.nodeTypeName} and ${getNodeOfPath(path.nodeTypeName)}`
        );
      }

      newNode = new ParseNodeClazz(path, state, this, initialData);
      newNode.init();
      newNode.initPlugins();
      setNodeOfPath(path, newNode);
    }
    return newNode;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter(path, ParseNodeClazz) {
    this.checkGen();
    ++this.recordedDepth;

    const { state } = this;
    let parseNode = this.createOnEnter(path, state, ParseNodeClazz, this);
    if (parseNode) {
      // push new node
      parseNode.phase = ParsePhase.Enter;
      Verbose && parseNode.hasPhase('enter', 'exit') && this.debug(`enter ${parseNode}`);
      this.push(ParseNodeClazz, parseNode);
      const data = parseNode.enter?.(path, state);
      parseNode.enterPlugins?.();

      if (data) {
        // enter produces data, usually used later during `gen`
        Object.assign(parseNode.data, data);
      }
    }
    else {
      // not a new node -> enterNested (prospectOnEnter returned false)
      parseNode = this.peekNode(ParseNodeClazz);
      if (!parseNode) {
        throw new Error(`In ${ParseNodeClazz.name}'s first enter prospectOnEnter returned (but should not return) null - ${getPresentableString(path)}`);
      }
      // if (!parseNode.enterNested) {
      //   throw new Error(`${ParseNodeClazz.name}.enterNested missing`);
      // }

      // enterNested
      parseNode._nestedEnterCount = (parseNode._nestedEnterCount || 0) + 1;
      parseNode.enterNested?.(path, state);
    }
  }

  // ###########################################################################
  // exit
  // ###########################################################################

  exit(path, ParseNodeClazz) {
    this.checkGen();

    // NOTE: even if we don't create a newNode, we push `null`.
    //    This way, every `push` will always match a `pop`.
    const parseNode = this.peekNode(ParseNodeClazz);
    if (!parseNode) {
      // eslint-disable-next-line max-len
      throw new Error(`Parsing failed. Exited same ${ParseNodeClazz.name} node more thance once.\n  Node was not on stack anymore: ${getNodeOfPath(path)} \n  Path: ${getPresentableString(path)}`);
    }

    Verbose && parseNode.hasPhase('exit1') && this.debug(`exit1 ${parseNode}`);

    if (parseNode._nestedEnterCount) {
      --parseNode._nestedEnterCount;
      this.nodePhase(ParsePhase.Exit1, parseNode, parseNode.exitNested);
    }
    else {
      this.nodePhase(ParsePhase.Exit1, parseNode, parseNode.exit1Plugins, parseNode.exit1);
      this.pop(path, ParseNodeClazz);

      this.genTasks.push({
        parseNode
      });
    }
    --this.recordedDepth;
  }

  // ###########################################################################
  // gen
  // ###########################################################################

  checkGen() {
    if (this.isGen) {
      // stop parsing after `gen` started
      throw new Error(`Stack still visited, after parsing completed.`);
    }
  }

  /**
   * Iterates through `this.genTasks` to gen (transpile) the code.
   * NOTE: the order of `genTasks` is that of the `exit` call, meaning inner-most first.
   */
  genAll() {
    this.isGen = true;
    const { genTasks } = this;

    // const nTasks = this.genTasks.length;
    // const allStaticData = new Array(nTasks + 1);
    // allStaticData[0] = null;

    // NOTE: cannot assign id here because nodes need to be able to produce multiple and different types of static data types
    // let staticId = 0;
    // for (const task of genTasks) {
    //   const { parseNode } = task;
    //   // 
    //   // parseNode.staticId = ++staticId;
    // }

    // NOTE: the actual "exit" is run here for convinience. `exit1` is more of a "warm-up round".
    for (const task of genTasks) {
      const { parseNode } = task;
      Verbose && parseNode.hasPhase('enter', 'exit') && this.debug(`exit ${parseNode}`);
      this.nodePhase(ParsePhase.Exit, parseNode, parseNode.exitPlugins, parseNode.exit);
    }


    for (const task of genTasks) {
      const { parseNode } = task;
      Verbose && parseNode.hasPhase('instrument1') && debug(`instrument1 ${parseNode}`);
      this.nodePhase(ParsePhase.Instrument1, parseNode, parseNode.instrument1Plugins, parseNode.instrument1);
    }

    for (const task of genTasks) {
      const { parseNode } = task;
      Verbose && parseNode.hasPhase('instrument') && debug(`instrument ${parseNode}`);
      this.nodePhase(ParsePhase.Instrument, parseNode, parseNode.instrumentPlugins, parseNode.instrument);
    }
  }


  /**
   * @param {ParseNode} parseNode
   */
  nodePhase(phase, parseNode, ...fs) {
    if (parseNode.phase > phase) {
      // every phase must only occur once
      throw new Error(`ParseNode phase order - is in ` +
        `${ParsePhase.nameFromForce(parseNode.phase)} when entering ` +
        `${ParsePhase.nameFromForce(phase)} - ${parseNode}`);
    }
    parseNode.phase = phase;
    for (const f of fs) {
      f?.call(parseNode);
    }
  }
}

