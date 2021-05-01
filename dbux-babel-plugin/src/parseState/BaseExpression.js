import ParseState from '../parseLib/ParseState';

export default class BaseExpression extends ParseState {
  inputNames;

  gen(path, state) {
    const { inputNames } = this;
    if (!Array.isArray(inputNames)) {
      throw new Error(`inputNames must be array (${this})`);
    }

    
  }
}