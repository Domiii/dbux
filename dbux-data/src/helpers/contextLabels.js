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
    const { contextId, parentContextId } = context;
    const parentContext = dp.collections.executionContexts.getById(parentContextId);
    const firstTrace = dp.indexes.traces.byContext.getFirst(contextId);
    const staticTrace = dp.collections.staticTraces.getById(firstTrace.staticTraceId);
    let displayName;
    if (staticTrace.displayName?.match(/^await /)) {
      // displayName = staticTrace.displayName.replace('await ', '').replace(/\([^(]*\)$/, '');
      displayName = staticTrace.displayName.replace('await ', '').replace(/;$/, '');
    }
    else {
      displayName = '(async start)';
    }
    return `${makeContextLabel(parentContext, app)} | ${displayName}`;
  }
  else {
    const { staticContextId } = context;
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    return `${staticContext.displayName}`;
  }
}