import StaticCollection from './StaticCollection';

export default class StaticVarAccessCollection extends StaticCollection {
  addVarAccess(path, ownerId, ownerType, name, isWrite) {
    const { loc } = path;
    const varRef = {
      _varId: this._getNextId(),
      _ownerId: ownerId,
      
      loc,
      ownerType,
      name,
      isWrite
    };

    this._push(varRef);
  }
}