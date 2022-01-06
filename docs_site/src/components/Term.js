import React from 'react';
import useBaseUrl from '../hooks/useBaseUrl';

/**
 * future-work: automatically get heading id from heading text.
 * 
 * NOTE: they use slugger and some manual string replacement to generate slug from heading.
 * 
 * @see https://github.com/facebook/docusaurus/blob/b393700a613ee00b8e59d347283f68495acb68ba/packages/docusaurus/src/commands/writeHeadingIds.ts#L41
 */

const ae = 'TODO';
// const acg = 'TODO';

const AbbrevAnchorsByAbbrev = {
  cgr: 'cgr',
  trace: 'trace',
  staticTrace: 'trace',
  context: 'context',
  acg: 'TODO', // /runtime-analysis/08-call-graph.mdx#async
  'call graph': 'call-graph',

  ae,
  aes: ae,
  'asynchronous event': ae,
  'asynchronous events': ae,

  'dynamic runtime analysis': 'dynamic-runtime-analysis',
  idbe: 'idbe'
};

const terminologyPath = 'advanced/terminology';

function makeTermSrc(term) {
  const anchor = AbbrevAnchorsByAbbrev[term.toLowerCase()];
  if (!anchor) {
    return null;
  }

  const baseUrl = useBaseUrl();

  return `${baseUrl}${terminologyPath}#${anchor}`;
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
