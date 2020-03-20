import StaticCollection from './StaticCollection';

export default class StaticVarAccessCollection extends StaticCollection {
  addVarAccess(name, path, ownerId, ownerType) {
    const { loc } = path.node;
    const varRef = {
      _varId: this._getNextId(),
      _ownerId: ownerId,

      loc,
      ownerType,
      name
    };

    this._push(varRef);
  }
}