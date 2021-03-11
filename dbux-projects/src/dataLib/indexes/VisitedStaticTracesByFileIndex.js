import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<ActionGroup>} */
export default class VisitedStaticTracesByFile extends CollectionIndex {
  constructor() {
    super('userActions', 'visitedStaticTracesByFile', { addOnNewData: false, isMap: true, isContainerSet: true });
  }

  // /** 
  //  * @param {PathwaysDataProvider} pdp
  //  * @param {UserAction} userAction
  //  */
  // makeKey(pdp, userAction) {
  //   // Only add manually
  // }
}