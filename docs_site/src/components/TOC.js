import React from 'react';
import TOCInline from '@theme/TOCInline';

const hidden = { display: 'none' };

export default function TOC({ toc }) {
  /**
   * NOTE: `TOCInline` actually adds two different TOCs, one on the right side and one inline.
   *    -> We want a TOC on the side, but not inline, so we hide the inline part.
   * @see https://docusaurus.io/docs/markdown-features/inline-toc
   */
  return (
    <div style={hidden}>
      <TOCInline toc={toc} />
    </div>
  );
}