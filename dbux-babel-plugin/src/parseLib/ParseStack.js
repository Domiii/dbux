import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { getNodeOfPath, setNodeOfPath } from './parseUtil';
import { locToString, pathToString } from '../helpers/pathHelpers';
import ParsePhase from './ParsePhase';

/** @typedef { import("./ParseNode").default } ParseNode */


/**
 * Since declarations are such a nuisance, they got their own verbosity setting.
 */
const VerboseDecl = 0;
// const VerboseDecl = 2;

const Verbose = 0;
// const Verbose = 1;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Stack');

function debugTag(obj) {
  return obj.debugTag || obj.name || obj.toString();
}

/**
 * Track read and write dependencies as we move through the AST.
 */
export default class ParseStack {
  /**
   * Nodes by type on the stack.
   * @type {Map.<string, ParseNode>}
   */
  _stackNodesByType = new Map();
  /**
   * @type {Array.<ParseNode>}
   */
  _stack = [];
  genTasks = [];
  isGen = false;
  /**
   * This is the depth of the stack, given the observed enters and exits.
   * NOTE: This does not represent the actual depth of the AST, since we are not visiting all AST nodes.
   */
  recordedDepth = 0;
  lastId = 0;

  /**
   * A dictionary of "special nodes" that themselves can subscribe themselves here
   * to be accessible by others.
   * Important: depending nodes should only use this up until `Exit1`, after
   * which the stack loses its structure.
   */
  specialNodes = {};

  constructor(state) {
    this.state = state;
    this.logger = newLogger(`Stack`);
    Verbose && this.logger.debug(`${state.fileName}`);
  }

  /** ###########################################################################
   * logging
   * ##########################################################################*/

  get Verbose() {
    return Verbose;
  }

  get VerboseDecl() {
    return VerboseDecl;
  }

  debug(arg0, ...args) {
    this.logger.debug(`${' '.repeat(this.recordedDepth)}${arg0}`, ...args);
  }

  warn(arg0, ...args) {
    this.logger.warn(`${' '.repeat(this.recordedDepth)}${arg0}`, ...args);
  }

  /** ###########################################################################
   * stack getters + queries
   * ##########################################################################*/

  getNodeOfPath(path) {
    return getNodeOfPath(path);
  }
  
  isNodeOnStack(name) {
    this.#assureStackStructure();
    return !!this._stackNodesByType.get(name)?.length;
  }

  getSpecialNode(name) {
    this.#assureStackStructure();
    return this.specialNodes[name];
  }

  #assureStackStructure() {
    if (this.phase > ParsePhase.Exit1) {
      throw new Error(`Cannot query stack structure after "Exit1".`);
    }
  }

  // ###########################################################################
  // private stuff
  // ###########################################################################

  /**
   * NOTE: cannot do on stack, since stack structure disappears after `exit1`
   * Use `ParseNode.peekNode` instead.
   * @return {ParseNode}
   */
  _peekNode(nameOrParseNodeClazz) {
    const name = isString(nameOrParseNodeClazz) ? nameOrParseNodeClazz : nameOrParseNodeClazz.name;
    const { _stackNodesByType } = this;
    const nodesOfType = _stackNodesByType.get(name);
    if (nodesOfType?.length) {
      return nodesOfType[nodesOfType.length - 1];
    }
    return null;
  }

  _peekNodeForce(nameOrParseNodeClazz) {
    const node = this._peekNode(nameOrParseNodeClazz);
    if (!node) {
      const { _stack } = this;
      const s = _stack.join('\n ');
      throw new Error(`Node "${nameOrParseNodeClazz}" not found on stack - current stack (${_stack.length}):\n ${s}`);
    }
    return node;
  }

  // ###########################################################################
  // push + pop
  // ###########################################################################

  /**
   * @param {*} ParseNodeClazz 
   * @param {ParseNode} newNode 
   */
  push(ParseNodeClazz, newNode) {
    const { name } = ParseNodeClazz;
    if (!name) {
      throw new Error(`\`static name\` is missing on ParseNode class: ${debugTag(ParseNodeClazz)}`);
    }

    const { _stack, _stackNodesByType } = this;
    _stack.push(newNode);
    let nodesOfType = _stackNodesByType.get(name);
    if (!nodesOfType) {
      _stackNodesByType.set(name, nodesOfType = []);
    }
    (Verbose >= 3) && this.debug(`push ${name}`);
    nodesOfType.push(newNode);
  }

  pop(path, ParseNodeClazz) {
    const { name } = ParseNodeClazz;
    const { _stack, _stackNodesByType } = this;
    const nodesOfType = _stackNodesByType.get(name);
    (Verbose >= 3) && this.debug(`pop ${name}`);
    const node = nodesOfType.pop();
    if (node.path !== path) {
      throw new Error(`ParseStack corrupted - exit path does not match stack node (of type ${name}) - ${pathToString(path)}`);
    }
    _stack.pop();
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
          `Tried to create node more than once. It might have more than one matching node type: ` +
          `"${path.node.type}". Previously created node: "${getNodeOfPath(path)}"`
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

  /**
   * See {@link ParsePhase} for phase ordering.
   */
  enter(path, ParseNodeClazz) {
    // if (path.shouldSkip) {
    //   console.error(`!!path.shouldSkip: "${pathToStringAnnotated(path, true)}"`);
    //   return;
    // }

    ++this.recordedDepth;

    const { state } = this;
    let parseNode = this.createOnEnter(path, state, ParseNodeClazz, this);
    if (parseNode) {
      // push new node
      parseNode.phase = ParsePhase.Enter;
      Verbose > 1 /* && parseNode.hasPhase('enter', 'exit') */ && this.debug(`ENTER ${parseNode}`);
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
      parseNode = this._peekNode(ParseNodeClazz);
      if (!parseNode) {
        throw new Error(`In ${ParseNodeClazz.name}'s first enter prospectOnEnter returned (but should not return) null - ${pathToString(path)}`);
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

  /**
   * See {@link ParsePhase} for phase ordering.
   */
  exit1(path, ParseNodeClazz) {
    const parseNode = this._peekNode(ParseNodeClazz);
    if (!parseNode) {
      // eslint-disable-next-line max-len
      throw new Error(`Parsing failed. Exited same ${ParseNodeClazz.name} node more thance once.\n  Node was not on stack anymore: ${getNodeOfPath(path)} \n  Path: ${pathToString(path)}`);
    }

    Verbose > 1 && parseNode.hasPhase('exit1') && this.debug(`exit1 ${parseNode}`);

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

  checkBeforeGen() {
    if (this.isGen) {
      // stop parsing after `gen` started
      throw new Error(`Stack still visited, after parsing completed.`);
    }
  }

  /**
   * Iterates through `this.genTasks` to gen (transpile) the code.
   * NOTE: the order of `genTasks` is that of the `exit` call, meaning inner-most first.
   * See {@link ParsePhase} for phase ordering.
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
      Verbose > 1 && parseNode.hasPhase('enter', 'exit') && this.debug(`EXIT ${parseNode}`);
      this.nodePhase(ParsePhase.Exit, parseNode, parseNode.exitPlugins, parseNode.exit);
    }


    for (const task of genTasks) {
      const { parseNode } = task;
      Verbose > 1 && parseNode.hasPhase('instrument1') && debug(`instrument1 ${parseNode}`);
      this.nodePhase(ParsePhase.Instrument1, parseNode, parseNode.instrument1Plugins, parseNode.instrument1);
    }

    for (const task of genTasks) {
      const { parseNode } = task;
      Verbose > 1 && parseNode.hasPhase('instrument') && debug(`instrument ${parseNode}`);
      this.nodePhase(ParsePhase.Instrument, parseNode, parseNode.instrumentPlugins, parseNode.instrument);
    }
  }


  /**
   * @param {ParseNode} parseNode
   */
  nodePhase(phase, parseNode, ...fs) {
    try {
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
    catch (err) {
      const loc = parseNode.path.node?.loc || parseNode.path.parentPath?.node?.loc;
      const where = `${this.state.filePath}${loc ? `:${locToString(loc)}` : ''}`;
      const s = parseNode.getParseNodeStackToString();
      throw new NestedError(`Dbux Phase "${ParsePhase.nameFromForce(phase)}" failed at ${where}${s}\n`, err);
    }
  }
}

