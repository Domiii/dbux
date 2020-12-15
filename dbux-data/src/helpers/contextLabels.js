
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';

/** @typedef {import('@dbux/common/src/core/data/ExecutionContext').default} ExecutionContext */
/** @typedef {import('../applications/Application').default} Application */

/**
 * @param {ExecutionContext} context 
 * @param {Application} app 
 * @return {string}
 */
export function makeContextLabel(context, app) {
  const { contextType: type } = context;

  const dp = app.dataProvider;

  if (ExecutionContextType.is.Resume(type)) {
    const { parentContextId } = context;
    const parentContext = dp.collections.executionContexts.getById(parentContextId);
    return `[res] ${makeContextLabel(parentContext, app)}`;
  }
  else {
    const { staticContextId } = context;
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    return `${staticContext.displayName}`;
  }
}