import StaticCollection from './StaticCollection';

export default class StaticLoopVarRefCollection extends StaticCollection {
  // addVarRef(path, name, isWrite, loopId) {
  addVarRef(path, name, loopId) {
    const { loc } = path;
    const varRef = {
      _varId: this.getNextId(),
      _loopId: loopId,
      
      loc, 
      name,
      // isWrite
    };

    this._push(varRef);
  }
}