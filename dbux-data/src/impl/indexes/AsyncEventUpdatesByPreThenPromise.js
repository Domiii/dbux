import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import CollectionIndex from '../../indexes/CollectionIndex';



// /** 
//  * Used to lookup children in promise tree.
//  * 
//  * @extends {CollectionIndex<AsyncEventUpdate>}
//  */
// export default class AsyncEventUpdatesByPreThenPromise extends CollectionIndex {
//   constructor() {
//     super('asyncEventUpdates', 'byPreThenPromise');
//   }

//   /**
//    * @override
//    * @param {AsyncEventUpdate} asyncEventUpdate
//    */
//   makeKey(dp, { type, promiseId: preEventPromise/* , postEventPromiseId */ }) {
//     if (!AsyncEventUpdateType.is.PreThen(type)) {
//       return false;
//     }
//     return preEventPromise;
//   }
// }
