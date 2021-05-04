import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';
import { getChildPaths } from './parseUtil';

const Verbose = 1;
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

  constructor(state) {
    this.state = state;
  }

  getNode(nameOrParseNodeClazz) {
    const name = isString(nameOrParseNodeClazz) ? nameOrParseNodeClazz : nameOrParseNodeClazz.name;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    if (nodesOfType?.length) {
      return nodesOfType[nodesOfType.length - 1];
    }
    return null;
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
    (Verbose > 1) && debug(`push ${name}`);
    nodesOfType.push(newNode);
  }

  pop(ParseNodeClazz) {
    const { name } = ParseNodeClazz;
    const { _stack } = this;
    const nodesOfType = _stack.get(name);
    (Verbose > 1) && debug(`pop ${name}`);
    return nodesOfType.pop();
  }

  // ###########################################################################
  // parse utilities
  // ###########################################################################

  createOnEnter(path, state, ParseNodeClazz) {
    let newNode = null;
    const initialData = ParseNodeClazz.prospectOnEnter(path, state);
    if (initialData) {
      newNode = new ParseNodeClazz(path, state, initialData);
      newNode.init();

      path.setData('_dbux_node', newNode);
    }
    return newNode;
  }

  getChildNodes(path, ParseNodeClazz) {
    const childPaths = getChildPaths(path, ParseNodeClazz.nodeNames);
    return childPaths.map(p => p.getData('_dbux_node'));
  }

  // ###########################################################################
  // enter + exit
  // ###########################################################################

  enter(path, ParseNodeClazz) {
    const { state } = this;
    const parseNode = this.createOnEnter(path, state, ParseNodeClazz, this);
    this.push(ParseNodeClazz, parseNode);
    if (parseNode) {
      const data = parseNode.enter(path, state);
      if (data) {
        // enter produces data, usually used later during `gen`
        Object.assign(parseNode.data, data);
      }
    }
  }

  exit(path, ParseNodeClazz) {
    // NOTE: even if we don't create a newNode, we push `null`.
    //    This way, every `push` will always match a `pop`.
    const parseNode = this.pop(ParseNodeClazz);
    if (parseNode) {
      // const children = this.getChildNodes(path, ParseNodeClazz);
      const childPaths = getChildPaths(path, ParseNodeClazz.nodeNames);
      const children = childPaths.map(p => p.getData('_dbux_node'));

      // pass child ParseNodes, followed by array of actual paths (NOTE: ParseNode might be null, even if path exists)
      parseNode.exit(...children, childPaths);

      this.genTasks.push({
        parseNode
      });
    }
  }

  /**
   * Iterates through `this.genTasks` to gen (transpile) the code.
   * NOTE: the order of `genTasks` is that of the `exit` call, meaning inner-most first.
   */
  genAll() {
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