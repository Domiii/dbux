import sumBy from 'lodash/sumBy';

/** ###########################################################################
 * data stats
 *  #########################################################################*/

export function getDataCount(data) {
  const nEntries = sumBy(Object.values(data), arr => arr?.length || 0);
  return nEntries;
}
