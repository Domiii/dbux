import isString from 'lodash/isString';

function debugTag(obj) {
  return obj.debugTag || obj.name || obj.toString();
}

/**
 * Track read and write dependencies as we move through the AST.
 */
export default class ParseStack {
  _stack = new Map();

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
    }
  }

  gen() {
    // TODO: handle gen phase separately from `exit`
  }
}