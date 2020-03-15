import StaticCollection from './StaticCollection';
import { getClosestScopedPath } from '../helpers/bindingsHelper';
import EmptyObject from '../../../dbux-common/src/util/EmptyObject';
import { isInLoc } from '../helpers/locHelpers';

export default class StaticVarAccessCollection extends StaticCollection {
  addVarAccess(name, path, isWrite, ownerId, ownerType) {
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