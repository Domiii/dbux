import isString from 'lodash/isString';

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

  push(ParseNodeClazz, newState) {
    const { name } = ParseNodeClazz;
    if (!name) {
      throw new Error(`\`static name\` is missing on ParseNode class: ${debugTag(ParseNodeClazz)}`);
    }

    const { _stack } = this;
    const stateStack = _stack.get(name) || _stack.set(name, []);
    stateStack.push(newState);
  }

  pop(ParseNodeClazz) {
    const { name } = ParseNodeClazz;
    const { _stack } = this;
    const stateStack = _stack.get(name);
    return stateStack.pop();
  }

  getState(nameOrParseNodeClazz) {
    const name = isString(nameOrParseNodeClazz) ? nameOrParseNodeClazz : nameOrParseNodeClazz.name;
    const { _stack } = this;
    const stateStack = _stack.get(name);
    if (stateStack?.length) {
      return stateStack[stateStack.length - 1];
    }
    return null;
  }

  // ###########################################################################
  // enter + exit
  // ###########################################################################

  enter(path, state, ParseNodeClazz) {
    const parseNode = ParseNodeClazz.createOnEnter(path, state, this, ParseNodeClazz);
    if (parseNode) {
      parseNode.enter(path, state);
    }
  }

  exit(path, state, ParseNodeClazz) {
    // NOTE: even if we don't create a newState, we push `null`.
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

    const nTasks = this.genTasks.length;
    const staticData = new Array(nTasks + 1);
    staticData[0] = null;

    // NOTE: cannot assign id here because nodes need to be able to produce multiple and different types of static data types
    // let staticId = 0;
    // for (const task of genTasks) {
    //   const { parseNode } = task;
    //   // 
    //   // parseNode.staticId = ++staticId;
    // }


    for (const task of genTasks) {
      const { parseNode } = task;
      staticData.push(this.gen(parseNode));
    }
  }

  gen(parseNode) {
    const staticData = parseNode.genStaticData(this.state);
    parseNode.instrument(staticData, this.state);
    return staticData;
  }
}