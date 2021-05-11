import isString from 'lodash/isString';
import maxBy from 'lodash/maxBy';
import { newLogger } from '@dbux/common/src/log/logger';
import { getChildPaths } from './parseUtil';
import { getPresentableString } from '../helpers/pathHelpers';
import ParseRegistry from './ParseRegistry';

/** @typedef { import("./ParseNode").default } ParseNode */

const Verbose = 1;
// const Verbose = 0;

const DbuxNodeId = '_dbux_node_';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Stack');

function debugTag(obj) {
  return obj.debugTag || obj.name || obj.toString();
}

function getDbuxNode(p) {
  return p.getData(DbuxNodeId);
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

  constructor(state) {
    this.state = state;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  /**
   * @return {ParseNode}
   */
  getNode(nameOrParseNodeClazz) {
    const name = isString(nameOrParseNodeClazz) ? nameOrParseNodeClazz : nameOrParseNodeClazz.name;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    if (nodesOfType?.length) {
      return nodesOfType[nodesOfType.length - 1];
    }
    return null;
  }

  getChildNodes(path, ParseNodeClazz) {
    const childPaths = getChildPaths(path, ParseNodeClazz.nodeNames);
    return childPaths.map(p => p.getData(DbuxNodeId));
  }

  /**
   * @return {ParseNode}
   */
  getNodeOfPlugin(pluginNameOrClazz) {
    const pluginName = isString(pluginNameOrClazz) ? pluginNameOrClazz : pluginNameOrClazz.name;
    const nodeNames = ParseRegistry.getParseNodeNamesOfPluginName(pluginName);
    if (!nodeNames) {
      return null;
    }

    // Of all candidate node types, peek the stack top, and of those take the deepest
    return maxBy(
      nodeNames.map(name => this.getNode(name)),
      node => node.recordedDepth
    );
  }

  getPlugin(pluginNameOrClazz) {
    return this.getNodeOfPlugin(pluginNameOrClazz)?.getPlugin(pluginNameOrClazz);
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
    (Verbose >= 2) && debug(`push ${name}`);
    nodesOfType.push(newNode);
  }

  pop(ParseNodeClazz) {
    const { name } = ParseNodeClazz;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    (Verbose >= 2) && debug(`pop ${name}`);
    return nodesOfType.pop();
  }

  // ###########################################################################
  // parse util
  // ###########################################################################

  createOnEnter(path, state, ParseNodeClazz) {
    let newNode = null;
    const initialData = ParseNodeClazz.prospectOnEnter(path, state);
    if (initialData) {
      newNode = new ParseNodeClazz(path, state, this, initialData);
      newNode.createPlugins();
      newNode.init();

      path.setData(DbuxNodeId, newNode);
    }
    return newNode;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter(path, ParseNodeClazz) {
    if (this.isGen) {
      // stop parsing after `gen` started
      return;
    }
    ++this.recordedDepth;

    const { state } = this;
    let parseNode = this.createOnEnter(path, state, ParseNodeClazz, this);
    if (parseNode) {
      this.push(ParseNodeClazz, parseNode);
      const data = parseNode.enter(path, state);
      if (data) {
        // enter produces data, usually used later during `gen`
        Object.assign(parseNode.data, data);
      }
    }
    else {
      parseNode = this.getNode(ParseNodeClazz);
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
    if (this.isGen) {
      // stop parsing after `gen` started
      return;
    }
    --this.recordedDepth;

    // NOTE: even if we don't create a newNode, we push `null`.
    //    This way, every `push` will always match a `pop`.
    const parseNode = this.getNode(ParseNodeClazz);
    if (!parseNode) {
      throw new Error(`Parsing failed. Exited same ${ParseNodeClazz.name} node more thance once - ${getPresentableString(path)}`);
    }

    if (parseNode._nestedEnterCount) {
      --parseNode._nestedEnterCount;
      if (parseNode.exitNested) {
        this._callExit(path, ParseNodeClazz, parseNode.exitNested, parseNode);
      }
    }
    else {
      this.pop(ParseNodeClazz);
      this._callExit(path, ParseNodeClazz, parseNode.exit, parseNode);

      this.genTasks.push({
        parseNode
      });
    }
  }

  _callExit(path, ParseNodeClazz, f, node) {
    const childPaths = getChildPaths(path, ParseNodeClazz.nodeNames);
    const children = childPaths.map(p => Array.isArray(p) ? p.map(getDbuxNode) : getDbuxNode(p));

    // pass child ParseNodes, followed by array of actual paths
    // NOTE: childPaths might contain null, childPaths wouldn't
    f.call(node, ...children, childPaths);
  }


  // ###########################################################################
  // gen
  // ###########################################################################

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


    for (const task of genTasks) {
      const { parseNode } = task;
      this.gen(parseNode);
      // allStaticData.push();
    }
  }

  /**
   * @param {ParseNode} parseNode 
   */
  gen(parseNode) {
    Verbose && debug(`gen ${parseNode}`);
    // const staticData = parseNode.genStaticData(this.state);
    parseNode.instrument(/* staticData, */);
    // return staticData;
  }
}