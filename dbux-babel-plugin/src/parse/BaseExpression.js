import ParseNode from '../parseLib/ParseNode';

export default class BaseExpression extends ParseNode {
  inputNames;

  gen(path, state) {
    const { inputNames } = this;
    if (!Array.isArray(inputNames)) {
      throw new Error(`inputNames must be array (${this})`);
    }

    
  }
}