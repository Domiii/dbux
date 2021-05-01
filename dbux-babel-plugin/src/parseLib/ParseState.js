
export default class ParseState {
  constructor(path, state) {
    this.enterPath = path;
    this.state = state;
  }

  init() { }

  static shouldCreateOnEnter(/* path, state */) {
    return true;
  }

  static createOnEnter(path, state, stack, ParseStateClazz) {
    let newState = null;
    if (ParseStateClazz.shouldCreateOnEnter(path, state)) {
      newState = new ParseStateClazz(path);
      newState.init();
    }
    return stack.push(ParseStateClazz, newState);
  }

  // static get prop() {
  //   return 
  // }

  toString() {
    return `${this.constructor.name}: ${this.enterPath.toString()}`;
  }
}