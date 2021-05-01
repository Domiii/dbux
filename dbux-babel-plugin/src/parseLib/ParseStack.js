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

  push(ParseStateClazz, newState) {
    const { name } = ParseStateClazz;
    if (!name) {
      throw new Error(`\`static name\` is missing on ParseState class: ${debugTag(ParseStateClazz)}`);
    }

    const { _stack } = this;
    const stateStack = _stack.get(name) || _stack.set(name, []);
    stateStack.push(newState);
  }

  pop(ParseStateClazz) {
    const { name } = ParseStateClazz;
    const { _stack } = this;
    const stateStack = _stack.get(name);
    return stateStack.pop();
  }

  getState(nameOrParseStateClazz) {
    const name = isString(nameOrParseStateClazz) ? nameOrParseStateClazz : nameOrParseStateClazz.name;
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

  enter(path, state, ParseStateClazz) {
    const parseState = ParseStateClazz.createOnEnter(path, state, this, ParseStateClazz);
    if (parseState) {
      parseState.enter(path, state);
    }
  }

  exit(path, state, ParseStateClazz) {
    // NOTE: even if we don't create a newState, we push `null`.
    //    This way, every `push` will always match a `pop`.
    const parseState = this.pop(ParseStateClazz);
    if (parseState) {
      parseState.exit(path, state);

      this.genTasks.push({
        parseState
      });
    }
  }

  // TODO: gen of some paths can remove other paths
  //        gen on enter should be able to fix that?

  genAll() {
    let staticId = 0;
    const nTasks = this.genTasks.length;
    const staticData = new Array(nTasks + 1);
    staticData[0] = null;

    for (const task of this.genTasks) {
      const { parseState } = task;
      parseState.staticId = ++staticId;
    }

    for (const task of this.genTasks) {
      const { parseState } = task;
      staticData.push(this.gen(parseState));
    }
  }

  gen(parseState) {
    const staticData = parseState.genStaticData(this.state);
    parseState.instrument(staticData, this.state);
    return staticData;
  }
}