import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';

export function makeContextLabel(context, application) {
  const {
    // contextType: type,
    staticContextId
  } = context;

  const staticContext = application.dataProvider.collections.staticContexts.getById(staticContextId);
  const {
    type
  } = staticContext;

  // const prefix = type === StaticContextType.Function ? 'ƒ ' : '';

  return `${staticContext.displayName}`;
}