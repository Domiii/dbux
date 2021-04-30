
export default class ParseState {
  constructor(path) {
    this.enterPath = path;
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
}