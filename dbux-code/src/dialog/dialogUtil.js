import isString from 'lodash/isString';

export async function getStringOrFunction(stringOrFunction) {
  if (isString(stringOrFunction)) {
    return stringOrFunction;
  }
  else {
    return await stringOrFunction();
  }
}

export async function makeButtonsByEdges(edges, defaultState = null) {
  const buttonEntries = await Promise.all(edges.map(async (edge) => {
    return [await getStringOrFunction(edge.text), async () => {
      await edge.click?.();
      return edge.node || defaultState;
    }];
  }));

  return Object.fromEntries(buttonEntries);
}