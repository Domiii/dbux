
export default class ParseNode {
  constructor(path, state) {
    this.enterPath = path;
    this.state = state;
  }

  get path() {
    return this.enterPath;
  }

  init() { }

  // static get prop() {
  //   return 
  // }

  toString() {
    return `${this.constructor.name}: ${this.enterPath.toString()}`;
  }

  // ###########################################################################
  // static members
  // ###########################################################################

  static shouldCreateOnEnter(/* path, state */) {
    return true;
  }

  static createOnEnter(path, state, stack, ParseNodeClazz) {
    let newState = null;
    if (ParseNodeClazz.shouldCreateOnEnter(path, state)) {
      newState = new ParseNodeClazz(path, state);
      newState.init();
    }
    return stack.push(ParseNodeClazz, newState);
  }
}