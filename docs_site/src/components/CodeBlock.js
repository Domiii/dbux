import React from 'react';
import CodeBlockOrig from '@theme/CodeBlock';
import classnames from 'classnames';
import isString from 'lodash/isString';

/**
 * Slightly improved CodeBlock.
 * NOTE: The standard docusaurus `CodeBlock` uses `prism`'s `Highlight`.
 * 
 * @see https://github.com/FormidableLabs/prism-react-renderer#theming
 * @see https://docusaurus.io/docs/markdown-features/react
 * @see https://github.com/facebook/docusaurus/search?q=%22prism-react-renderer%22
 * @see https://github.com/FormidableLabs/prism-react-renderer/blob/master/src/components/Highlight.js
 * @see https://github.com/facebook/docusaurus/blob/main/website/src/theme/CodeBlock/index.tsx
 * @see https://github.com/facebook/docusaurus/blob/master/packages/docusaurus-theme-classic/src/theme/CodeBlock/index.tsx
 */
export default function CodeBlock({ src, lang, minWidth, className, style, children, ...props }) {
  if (lang === undefined) {
    lang = 'js';
  }
  
  props.className = classnames(
    className,
    'code-block',
    {
      [`language-${lang}`]: !!lang
    }
  );

  style ||= {};
  if (minWidth) {
    minWidth = !isString(minWidth) ? `${minWidth}px` : minWidth;
    Object.assign(style, {
      minWidth
    });
  }

  // console.warn(props.className);

  /**
   * NOTE: `raw-loader` is still the recommendation by docusaurus, but deprecated since webpack@5.
   * NOTE2: We use + instead of template expressions.
   * NOTE3: Webpack supports limited dynamic expressions for paths (-> it bundles all files of the heuristically determined directory).
   * 
   * @see https://docusaurus.io/docs/markdown-features/react#importing-code-snippets
   * @see https://v4.webpack.js.org/loaders/raw-loader/#examples
   * @see https://webpack.js.org/guides/dependency-management/#require-with-expression
   * @see https://stackoverflow.com/questions/67923159/webpack-require-with-dynamic-path/67928028#67928028
   */

  if (src) {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    let content = require('!!raw-loader!../../code-samples/' + src);
    if (content.default) {
      // hackfix: esm conversion, if necessary
      content = content.default;
    }
    children = children || '';
    children += content;
  }

  if (isString(children)) {
    children = children.trim();
  }

  return (<CodeBlockOrig {...props}>{children}</CodeBlockOrig>);
}
