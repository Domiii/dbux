import React from 'react';
import useBaseUrl from '../hooks/useBaseUrl';

/**
 * future-work: automatically get heading id from heading text.
 * 
 * NOTE: they use slugger and some manual string replacement to generate slug from heading.
 * 
 * @see https://github.com/facebook/docusaurus/blob/b393700a613ee00b8e59d347283f68495acb68ba/packages/docusaurus/src/commands/writeHeadingIds.ts#L41
 */
const AbbrevAnchorsByAbbrev = {
  cgr: 'cgr',
  trace: 'trace'
};


function makeTermSrc(term) {
  const anchor = AbbrevAnchorsByAbbrev[term];
  if (!anchor) {
    return null;
  }

  const baseUrl = useBaseUrl();

  return `${baseUrl}advanced/terminology#${anchor}`;
}

/**
 * Create link to terminology.
 * 
 * TODO: maybe use a proper plugin instead
 * @see https://gitlab.grnet.gr/terminology/docusaurus-terminology
 */
export default function Term({ term, children = term }) {
  const src = makeTermSrc(term, children);
  if (!src) {
    return (<>
      ${children}<span className="color-gray border-gray round" title={`(could not look up "${children}")`}><sup>❓</sup></span>
    </>);
  }
  return (<a href={src} title={`lookup term: "${term}"`}>{children}<sup>❔</sup></a>);
}
