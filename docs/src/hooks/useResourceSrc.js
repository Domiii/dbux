import React from 'react';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useThemeContext from '@theme/hooks/useThemeContext';

/**
 * Look up resource src, relative to a resources/light or resources/dark folder.
 * 
 * @see https://stackoverflow.com/questions/64425555/is-it-possible-to-detect-if-docusaurus-is-in-light-or-dark-mode
 */
export default function useResourceSrc({ src, noLightMode }) {
  /**
   * @see https://docusaurus.io/docs/api/themes/configuration#hooks
   */
  const { isDarkTheme } = useThemeContext();

  /**
   * @see https://docusaurus.io/docs/docusaurus-core#usedocusauruscontext
   */
  const { siteConfig: {
    /**
     * NOTE: `baseUrl` must be a string with trailing slash.
     */
    baseUrl
  } } = useDocusaurusContext();

  let modePath;
  if (noLightMode) {
    modePath = '';
  }
  else {
    modePath = isDarkTheme ? 'dark/' : 'light/';
  }
  return `${baseUrl}${modePath}${src}`;
}