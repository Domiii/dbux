import StaticCollection from './StaticCollection';

export default class StaticLoopCollection extends StaticCollection {
  addLoop(path, type, loopHeadLoc, displayName) {
    this.checkPath(path);

    const loop = {
      _loopId: this.getNextId(),
      _staticContextId: dbuxState.getCurrentStaticContextId(path),

      type,
      loopHeadLoc,
      displayName
    };

    this._push(loop);

    return loop._loopId;
  }
}