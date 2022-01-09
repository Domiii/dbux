import React from 'react';
import useBaseUrl from '../hooks/useBaseUrl';

/**
 * future-work: automatically get heading id from heading text.
 * 
 * NOTE: they use slugger and some manual string replacement to generate slug from heading.
 * 
 * @see https://github.com/facebook/docusaurus/blob/b393700a613ee00b8e59d347283f68495acb68ba/packages/docusaurus/src/commands/writeHeadingIds.ts#L41
 */

// const acg = 'TODO';

const AcgPath = 'runtime-analysis/asynchronous-call-graph';

const PathByTerm = {
  'call graph': 'runtime-analysis/call-graph',

  acg: AcgPath,
  cgr: AcgPath,
  ae: AcgPath,
  aes: AcgPath,
  'asynchronous event': AcgPath,
  'asynchronous events': AcgPath,

  idbe: 'idbe'
};

const AeAnchor = 'ae';

const AnchorsByTerm = {
  trace: 'trace',
  staticTrace: 'trace',
  context: 'context',

  'call graph': 'call-graph',

  acg: '',
  cgr: 'cgr',
  ae: AeAnchor,
  aes: AeAnchor,
  'asynchronous event': AeAnchor,
  'asynchronous events': AeAnchor,

  // 'dynamic runtime analysis': 'dynamic-runtime-analysis',
  // idbe: 'idbe'
};

const TerminologyPathDefault = 'advanced/terminology';

function makeTermSrc(term) {
  const lookupTerm = term.toLowerCase();
  const terminologyPath = PathByTerm[lookupTerm] || TerminologyPathDefault;
  let anchor = AnchorsByTerm[lookupTerm];
  if (anchor === undefined) {
    return null;
  }
  
  anchor = `#${anchor}`;

  const baseUrl = useBaseUrl();

  return `${baseUrl}${terminologyPath}${anchor}`;
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
