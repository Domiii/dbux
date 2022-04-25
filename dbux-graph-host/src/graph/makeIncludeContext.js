import makeInclude from '@dbux/common-node/src/filters/makeInclude';
import allApplications from '@dbux/data/src/applications/allApplications';

/** @typedef { import("@dbux/common/src/types/ExecutionContext").default } ExecutionContext */

/**
 * @param {*} filterInput
 * @return {(context: ExecutionContext) => boolean} a predicate function that determines whether given context matches given filter.
 */
export default function makeIncludeContext(filterInput) {
  const shouldIncludePath = makeInclude(filterInput);
  /**
   * @param {ExecutionContext} context
   */
  return (context) => {
    const { applicationId, contextId } = context;
    const application = allApplications.getApplication(applicationId);
    const fpath = application.dataProvider.util.getContextFilePath(contextId);
    return shouldIncludePath(fpath);
  };
}