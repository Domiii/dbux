import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function useBaseUrl() {
  /**
   * @see https://docusaurus.io/docs/docusaurus-core#usedocusauruscontext
   */
  const { siteConfig: {
    /**
     * NOTE: `baseUrl` must be a string with trailing slash.
     */
    baseUrl
  } } = useDocusaurusContext();

  return baseUrl;
}