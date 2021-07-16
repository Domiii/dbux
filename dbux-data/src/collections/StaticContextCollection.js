import StaticContext from '@dbux/common/src/types/StaticContext';
import Collection from '../Collection';
import { deleteCachedLocRange } from '../util/misc';

/**
 * @extends {Collection<StaticContext>}
 */
export default class StaticContextCollection extends Collection {
  constructor(dp) {
    super('staticContexts', dp);
  }

  serialize(staticContext) {
    const staticContextData = { ...staticContext };
    delete staticContextData.filePath;
    deleteCachedLocRange(staticContextData.loc);
    return staticContextData;
  }
}
