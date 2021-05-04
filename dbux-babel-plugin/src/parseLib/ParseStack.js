import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';

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
  // enter + exit
  // ###########################################################################

  enter(path, state, ParseNodeClazz) {
    const parseNode = ParseNodeClazz.createOnEnter(path, state, ParseNodeClazz, this);
    this.push(ParseNodeClazz, parseNode);
    if (parseNode) {
      parseNode.enter(path, state);
    }
  }

  exit(path, state, ParseNodeClazz) {
    // NOTE: even if we don't create a newNode, we push `null`.
    //    This way, every `push` will always match a `pop`.
    const parseNode = this.pop(ParseNodeClazz);
    if (parseNode) {
      parseNode.exit(path, state);

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