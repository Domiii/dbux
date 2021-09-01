import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import StaticCollection from './StaticCollection';

export default class StaticContextCollection extends StaticCollection {
  /**
   * Generate a new variable identifier to store `contextId` for given path.
   * NOTE: This does NOT generate the contextId itself, nor put it anywhere into the program.
   */
  genContextId(path) {
    const contextId = path.scope.generateUidIdentifier('cid');
    // path.setData('contextIdName', contextId);
    return contextId;
  }
  
  getParentStaticContextId(path) {
    return this.state.getClosestAncestorData(path, 'staticId');
  }
  
  getCurrentStaticContextId(path) {
    return path.getData('staticId') || this.state.getClosestAncestorData(path, 'staticId');
  }

  getClosestContextIdName(path) {
    return this.state.getClosestAncestorData(path, 'contextIdName');
  }

  /**
   * Contexts are (mostly) potential stackframes; that is `Program` and `Function` nodes.
   */
  addStaticContext(path, data) {
    path = path.isFunction() ? path.get('body') : path;
    this.checkPath(path);

    // console.log('STATIC', path.get('id')?.name, '@', `${state.filename}:${line}`);
    const _staticId = this._getNextId();
    const _parentId = this.getParentStaticContextId(path);
    // console.log('actualParent',  toSourceString(actualParent.node));
    const { loc } = path.node;
    this._push({
      _staticId,
      _parentId,
      loc,
      ...data
    });
    
    // NOTE: `staticId` is used to determine which `context` the given path is "in".
    //    -> For Function{Expression,Declaration} et al., we want to set it for the body, not the path itself.
    path.setData('staticId', _staticId);

    return _staticId;
  }

  addResumeContext(bodyOrAwaitPath, locStart) {
    this.checkPath(bodyOrAwaitPath);

    const _parentId = this.getCurrentStaticContextId(bodyOrAwaitPath);
    const bodyParent = this.getById(_parentId);
    const { end } = bodyParent.loc;     // we don't know where it ends yet (can only be determined at run-time)
    const loc = {
      start: locStart,
      end
    };

    const _staticId = this._getNextId();
    this._push({
      type: StaticContextType.Resume,
      _staticId,
      _parentId,
      // displayName: parent.displayName,
      loc
    });
    return _staticId;
  }
}