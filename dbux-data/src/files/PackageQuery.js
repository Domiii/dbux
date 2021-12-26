import SubscribableQuery from '../queries/SubscribableQuery';

export default class PackageQuery extends SubscribableQuery {
  constructor() {
    super('packagesByProgramId', {
      collectionNames: ['staticProgramContexts']
    });
  }

  /** ###########################################################################
   * Interface implementation
   * ##########################################################################*/

  on = {
    staticProgramContexts(programs) {
      // TODO
    }
  };
}
